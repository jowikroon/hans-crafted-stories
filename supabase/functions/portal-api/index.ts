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
        // Attributes cascade via FK, but delete explicitly to be safe
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

      default:
        return err(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("portal-api error:", error);
    return err(error instanceof Error ? error.message : "Unknown error", 500);
  }
});
