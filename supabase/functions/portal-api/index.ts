import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const err = (msg: string, status = 400) => json({ error: msg }, status);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    switch (action) {
      // ── Tools ──────────────────────────────────────────────

      case "list_tools": {
        const { data: tools, error } = await supabase
          .from("portal_tools")
          .select("*")
          .order("sort_order");
        if (error) return err(error.message, 500);

        if (tools && tools.length > 0) {
          const ids = tools.map((t: any) => t.id);
          const { data: attrs } = await supabase
            .from("tool_attributes")
            .select("*")
            .in("tool_id", ids);
          const map = new Map<string, any[]>();
          for (const a of attrs || []) {
            if (!map.has(a.tool_id)) map.set(a.tool_id, []);
            map.get(a.tool_id)!.push(a);
          }
          for (const t of tools) (t as any).attributes = map.get(t.id) || [];
        }
        return json({ data: tools });
      }

      case "get_tool": {
        const { id, name } = body;
        let query = supabase.from("portal_tools").select("*");
        if (id) query = query.eq("id", id);
        else if (name) query = query.ilike("name", name);
        else return err("Provide id or name");

        const { data: tool, error } = await query.maybeSingle();
        if (error) return err(error.message, 500);
        if (!tool) return err("Tool not found", 404);

        const { data: attrs } = await supabase
          .from("tool_attributes")
          .select("*")
          .eq("tool_id", tool.id);
        (tool as any).attributes = attrs || [];
        return json({ data: tool });
      }

      case "create_tool": {
        const { attributes, ...toolData } = body;
        delete toolData.action;
        const { data: tool, error } = await supabase
          .from("portal_tools")
          .insert(toolData)
          .select()
          .single();
        if (error) return err(error.message, 500);

        if (attributes && Array.isArray(attributes) && attributes.length > 0) {
          const rows = attributes.map((a: any) => ({
            tool_id: tool.id,
            key: a.key,
            value: a.value,
          }));
          await supabase.from("tool_attributes").insert(rows);
        }

        const { data: attrs } = await supabase
          .from("tool_attributes")
          .select("*")
          .eq("tool_id", tool.id);
        (tool as any).attributes = attrs || [];
        return json({ data: tool }, 201);
      }

      case "update_tool": {
        const { id, ...updates } = body;
        delete updates.action;
        if (!id) return err("id is required");
        const { data: tool, error } = await supabase
          .from("portal_tools")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) return err(error.message, 500);
        return json({ data: tool });
      }

      case "delete_tool": {
        const { id } = body;
        if (!id) return err("id is required");
        await supabase.from("tool_attributes").delete().eq("tool_id", id);
        const { error } = await supabase.from("portal_tools").delete().eq("id", id);
        if (error) return err(error.message, 500);
        return json({ success: true });
      }

      // ── Attributes ────────────────────────────────────────

      case "list_attributes": {
        const { tool_id } = body;
        if (!tool_id) return err("tool_id is required");
        const { data, error } = await supabase
          .from("tool_attributes")
          .select("*")
          .eq("tool_id", tool_id)
          .order("created_at");
        if (error) return err(error.message, 500);
        return json({ data });
      }

      case "add_attribute": {
        const { tool_id, key, value } = body;
        if (!tool_id || !key || value === undefined) return err("tool_id, key, value required");
        const { data, error } = await supabase
          .from("tool_attributes")
          .insert({ tool_id, key, value })
          .select()
          .single();
        if (error) return err(error.message, 500);
        return json({ data }, 201);
      }

      case "update_attribute": {
        const { id, value } = body;
        if (!id || value === undefined) return err("id and value required");
        const { data, error } = await supabase
          .from("tool_attributes")
          .update({ value })
          .eq("id", id)
          .select()
          .single();
        if (error) return err(error.message, 500);
        return json({ data });
      }

      case "delete_attribute": {
        const { id } = body;
        if (!id) return err("id is required");
        const { error } = await supabase.from("tool_attributes").delete().eq("id", id);
        if (error) return err(error.message, 500);
        return json({ success: true });
      }

      // ── Blog Posts ────────────────────────────────────────

      case "list_blog_posts": {
        const { published_only } = body;
        let query = supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
        if (published_only) query = query.eq("published", true);
        const { data, error } = await query;
        if (error) return err(error.message, 500);
        return json({ data });
      }

      case "get_blog_post": {
        const { id, slug } = body;
        let query = supabase.from("blog_posts").select("*");
        if (id) query = query.eq("id", id);
        else if (slug) query = query.eq("slug", slug);
        else return err("Provide id or slug");
        const { data, error } = await query.maybeSingle();
        if (error) return err(error.message, 500);
        if (!data) return err("Blog post not found", 404);
        return json({ data });
      }

      case "create_blog_post": {
        const postData = { ...body };
        delete postData.action;
        const { data, error } = await supabase
          .from("blog_posts")
          .insert(postData)
          .select()
          .single();
        if (error) return err(error.message, 500);
        return json({ data }, 201);
      }

      case "update_blog_post": {
        const { id, ...updates } = body;
        delete updates.action;
        if (!id) return err("id is required");
        const { data, error } = await supabase
          .from("blog_posts")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) return err(error.message, 500);
        return json({ data });
      }

      case "delete_blog_post": {
        const { id } = body;
        if (!id) return err("id is required");
        const { error } = await supabase.from("blog_posts").delete().eq("id", id);
        if (error) return err(error.message, 500);
        return json({ success: true });
      }

      // ── Case Studies ──────────────────────────────────────

      case "list_case_studies": {
        const { published_only } = body;
        let query = supabase.from("case_studies").select("*").order("sort_order");
        if (published_only) query = query.eq("published", true);
        const { data, error } = await query;
        if (error) return err(error.message, 500);
        return json({ data });
      }

      case "get_case_study": {
        const { id } = body;
        if (!id) return err("id is required");
        const { data, error } = await supabase
          .from("case_studies")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (error) return err(error.message, 500);
        if (!data) return err("Case study not found", 404);
        return json({ data });
      }

      case "create_case_study": {
        const studyData = { ...body };
        delete studyData.action;
        const { data, error } = await supabase
          .from("case_studies")
          .insert(studyData)
          .select()
          .single();
        if (error) return err(error.message, 500);
        return json({ data }, 201);
      }

      case "update_case_study": {
        const { id, ...updates } = body;
        delete updates.action;
        if (!id) return err("id is required");
        const { data, error } = await supabase
          .from("case_studies")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) return err(error.message, 500);
        return json({ data });
      }

      case "delete_case_study": {
        const { id } = body;
        if (!id) return err("id is required");
        const { error } = await supabase.from("case_studies").delete().eq("id", id);
        if (error) return err(error.message, 500);
        return json({ success: true });
      }

      // ── User Management ────────────────────────────────
      case "create_user": {
        const { email, password, display_name, role, tab_access } = body;
        if (!email || !password) return err("email and password required");
        
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        let userId: string;

        if (authError) {
          // If user already exists in auth, look them up and re-use
          if (authError.message.includes("already been registered")) {
            const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) return err(listError.message, 500);
            const existing = listData.users.find((u: any) => u.email === email);
            if (!existing) return err("User exists in auth but could not be found", 500);
            userId = existing.id;
          } else {
            return err(authError.message, 500);
          }
        } else {
          userId = authData.user.id;
        }

        // Upsert portal profile (avoid duplicate if profile already exists)
        const { error: profileError } = await supabase
          .from("portal_profiles")
          .upsert({
            user_id: userId,
            display_name: display_name || email.split("@")[0],
            email,
            tab_access: tab_access || ["tools"],
          }, { onConflict: "user_id" });
        if (profileError) console.error("Profile upsert error:", profileError.message);

        // Upsert role
        if (role) {
          const { error: roleError } = await supabase
            .from("user_roles")
            .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
          if (roleError) console.error("Role upsert error:", roleError.message);
        }
        
        return json({ data: { user_id: userId, email } }, 201);
      }

      case "delete_user": {
        const { user_id } = body;
        if (!user_id) return err("user_id is required");

        // Delete all related rows in correct order
        await supabase.from("user_tool_access").delete().eq("user_id", user_id);
        await supabase.from("user_content_access").delete().eq("user_id", user_id);
        await supabase.from("user_ai_access").delete().eq("user_id", user_id);
        await supabase.from("user_roles").delete().eq("user_id", user_id);
        await supabase.from("portal_profiles").delete().eq("user_id", user_id);

        // Delete the auth user last
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user_id);
        if (authDeleteError) {
          console.error("Auth delete error:", authDeleteError.message);
          return err(authDeleteError.message, 500);
        }

        return json({ success: true });
      }

      default:
        return err(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("portal-api error:", error);
    return err(error instanceof Error ? error.message : "Unknown error", 500);
  }
});