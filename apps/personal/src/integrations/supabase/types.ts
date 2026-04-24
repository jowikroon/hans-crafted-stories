export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          ai_detection_score: number | null
          article_type: string | null
          brief_json: Json | null
          canonical_url: string | null
          category: string
          completeness_score: number | null
          content: string
          content_nl: string
          created_at: string
          draft_version: number | null
          editorial_stage: string | null
          excerpt: string
          excerpt_nl: string
          human_gaps_filled: boolean | null
          id: string
          image_url: string
          internal_links: string[] | null
          json_ld: Json | null
          linkedin_post: string | null
          linkedin_post_nl: string | null
          meta_description: string | null
          meta_title: string | null
          og_description: string
          og_image: string | null
          og_title: string
          primary_keyword: string
          published: boolean
          quality_score: Json | null
          read_time: string
          readability_score: number | null
          reading_time: string | null
          rewrite_count: number | null
          scheduled_at: string | null
          seo_score: number | null
          slug: string
          status: string
          tags: string[]
          title: string
          title_nl: string
          updated_at: string
          voice_match_score: number | null
          voice_template_id: string | null
          word_count: number | null
        }
        Insert: {
          ai_detection_score?: number | null
          article_type?: string | null
          brief_json?: Json | null
          canonical_url?: string | null
          category?: string
          completeness_score?: number | null
          content?: string
          content_nl?: string
          created_at?: string
          draft_version?: number | null
          editorial_stage?: string | null
          excerpt?: string
          excerpt_nl?: string
          human_gaps_filled?: boolean | null
          id?: string
          image_url?: string
          internal_links?: string[] | null
          json_ld?: Json | null
          linkedin_post?: string | null
          linkedin_post_nl?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string
          og_image?: string | null
          og_title?: string
          primary_keyword?: string
          published?: boolean
          quality_score?: Json | null
          read_time?: string
          readability_score?: number | null
          reading_time?: string | null
          rewrite_count?: number | null
          scheduled_at?: string | null
          seo_score?: number | null
          slug: string
          status?: string
          tags?: string[]
          title: string
          title_nl?: string
          updated_at?: string
          voice_match_score?: number | null
          voice_template_id?: string | null
          word_count?: number | null
        }
        Update: {
          ai_detection_score?: number | null
          article_type?: string | null
          brief_json?: Json | null
          canonical_url?: string | null
          category?: string
          completeness_score?: number | null
          content?: string
          content_nl?: string
          created_at?: string
          draft_version?: number | null
          editorial_stage?: string | null
          excerpt?: string
          excerpt_nl?: string
          human_gaps_filled?: boolean | null
          id?: string
          image_url?: string
          internal_links?: string[] | null
          json_ld?: Json | null
          linkedin_post?: string | null
          linkedin_post_nl?: string | null
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string
          og_image?: string | null
          og_title?: string
          primary_keyword?: string
          published?: boolean
          quality_score?: Json | null
          read_time?: string
          readability_score?: number | null
          reading_time?: string | null
          rewrite_count?: number | null
          scheduled_at?: string | null
          seo_score?: number | null
          slug?: string
          status?: string
          tags?: string[]
          title?: string
          title_nl?: string
          updated_at?: string
          voice_match_score?: number | null
          voice_template_id?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_voice_template_id_fkey"
            columns: ["voice_template_id"]
            isOneToOne: false
            referencedRelation: "hvl_voice_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_design_reviews: {
        Row: {
          created_at: string | null
          findings: string
          id: string
          priority: string | null
          recommendations: string
          review_category: string
          review_title: string
          score: number
        }
        Insert: {
          created_at?: string | null
          findings: string
          id?: string
          priority?: string | null
          recommendations: string
          review_category: string
          review_title: string
          score: number
        }
        Update: {
          created_at?: string | null
          findings?: string
          id?: string
          priority?: string | null
          recommendations?: string
          review_category?: string
          review_title?: string
          score?: number
        }
        Relationships: []
      }
      blog_post_versions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          content: string
          created_at: string | null
          excerpt: string
          id: string
          post_id: string
          title: string
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string
          id?: string
          post_id: string
          title?: string
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string
          id?: string
          post_id?: string
          title?: string
        }
        Relationships: []
      }
      case_studies: {
        Row: {
          category: string
          content: string
          content_nl: string
          created_at: string
          description: string
          description_nl: string
          external_url: string | null
          id: string
          image: string
          published: boolean
          sort_order: number
          title: string
          title_nl: string
          updated_at: string
          year: string
        }
        Insert: {
          category?: string
          content?: string
          content_nl?: string
          created_at?: string
          description?: string
          description_nl?: string
          external_url?: string | null
          id?: string
          image?: string
          published?: boolean
          sort_order?: number
          title: string
          title_nl?: string
          updated_at?: string
          year?: string
        }
        Update: {
          category?: string
          content?: string
          content_nl?: string
          created_at?: string
          description?: string
          description_nl?: string
          external_url?: string | null
          id?: string
          image?: string
          published?: boolean
          sort_order?: number
          title?: string
          title_nl?: string
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      category_cards: {
        Row: {
          active_border_color: string
          active_color_from: string
          active_color_to: string
          border_color: string
          color_from: string
          color_to: string
          created_at: string
          description: string
          icon: string
          id: string
          is_visible: boolean
          label: string
          page: string
          sort_order: number
          text_color: string
          updated_at: string
          value: string
        }
        Insert: {
          active_border_color?: string
          active_color_from?: string
          active_color_to?: string
          border_color?: string
          color_from?: string
          color_to?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_visible?: boolean
          label: string
          page: string
          sort_order?: number
          text_color?: string
          updated_at?: string
          value: string
        }
        Update: {
          active_border_color?: string
          active_color_from?: string
          active_color_to?: string
          border_color?: string
          color_from?: string
          color_to?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_visible?: boolean
          label?: string
          page?: string
          sort_order?: number
          text_color?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          reason?: string
        }
        Relationships: []
      }
      empire_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          message: string
          metadata: Json | null
          monday_item_id: string | null
          source: string
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          message: string
          metadata?: Json | null
          monday_item_id?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          monday_item_id?: string | null
          source?: string
        }
        Relationships: []
      }
      hans_blog_memory: {
        Row: {
          brand_voice_context: string
          content_category: string
          narrative_history: string
          updated_at: string
        }
        Insert: {
          brand_voice_context?: string
          content_category: string
          narrative_history?: string
          updated_at?: string
        }
        Update: {
          brand_voice_context?: string
          content_category?: string
          narrative_history?: string
          updated_at?: string
        }
        Relationships: []
      }
      hvl_voice_templates: {
        Row: {
          archived_at: string | null
          avg_paragraph_sentences: number | null
          banned_words: string[] | null
          category: string
          closing_examples: string[] | null
          content_rules: string
          created_at: string
          description: string | null
          enthusiasm: number
          formality: number
          humor: number
          id: string
          inclusivity_rules: string
          is_default: boolean
          language: string | null
          max_paragraph_sentences: number | null
          max_sentence_words: number | null
          name: string
          opening_examples: string[] | null
          passive_voice_max_pct: number | null
          pending_terms: string[]
          perspective: string
          preferred_terms: string[]
          required_elements: string[] | null
          respectfulness: number
          seo_guidelines: string | null
          short_code: string | null
          target_audience: string
          target_reading_level: number
          tone: string
          transition_examples: string[] | null
          updated_at: string
          writing_style: string
          writing_style_rules: Json | null
        }
        Insert: {
          archived_at?: string | null
          avg_paragraph_sentences?: number | null
          banned_words?: string[] | null
          category: string
          closing_examples?: string[] | null
          content_rules?: string
          created_at?: string
          description?: string | null
          enthusiasm?: number
          formality?: number
          humor?: number
          id?: string
          inclusivity_rules?: string
          is_default?: boolean
          language?: string | null
          max_paragraph_sentences?: number | null
          max_sentence_words?: number | null
          name: string
          opening_examples?: string[] | null
          passive_voice_max_pct?: number | null
          pending_terms?: string[]
          perspective?: string
          preferred_terms?: string[]
          required_elements?: string[] | null
          respectfulness?: number
          seo_guidelines?: string | null
          short_code?: string | null
          target_audience: string
          target_reading_level?: number
          tone: string
          transition_examples?: string[] | null
          updated_at?: string
          writing_style: string
          writing_style_rules?: Json | null
        }
        Update: {
          archived_at?: string | null
          avg_paragraph_sentences?: number | null
          banned_words?: string[] | null
          category?: string
          closing_examples?: string[] | null
          content_rules?: string
          created_at?: string
          description?: string | null
          enthusiasm?: number
          formality?: number
          humor?: number
          id?: string
          inclusivity_rules?: string
          is_default?: boolean
          language?: string | null
          max_paragraph_sentences?: number | null
          max_sentence_words?: number | null
          name?: string
          opening_examples?: string[] | null
          passive_voice_max_pct?: number | null
          pending_terms?: string[]
          perspective?: string
          preferred_terms?: string[]
          required_elements?: string[] | null
          respectfulness?: number
          seo_guidelines?: string | null
          short_code?: string | null
          target_audience?: string
          target_reading_level?: number
          tone?: string
          transition_examples?: string[] | null
          updated_at?: string
          writing_style?: string
          writing_style_rules?: Json | null
        }
        Relationships: []
      }
      media_library: {
        Row: {
          alt_text: string | null
          created_at: string | null
          file_name: string
          file_size: number | null
          folder: string | null
          id: string
          mime_type: string | null
          public_url: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          file_name: string
          file_size?: number | null
          folder?: string | null
          id?: string
          mime_type?: string | null
          public_url: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          folder?: string | null
          id?: string
          mime_type?: string | null
          public_url?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content_group: string
          content_key: string
          content_label: string
          content_type: string
          content_value: string
          created_at: string
          id: string
          page: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          content_group?: string
          content_key: string
          content_label?: string
          content_type?: string
          content_value?: string
          created_at?: string
          id?: string
          page: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          content_group?: string
          content_key?: string
          content_label?: string
          content_type?: string
          content_value?: string
          created_at?: string
          id?: string
          page?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      page_content_versions: {
        Row: {
          changed_by: string | null
          content_group: string
          content_id: string
          content_key: string
          content_label: string
          content_value: string
          created_at: string
          id: string
          page: string
        }
        Insert: {
          changed_by?: string | null
          content_group?: string
          content_id: string
          content_key: string
          content_label?: string
          content_value?: string
          created_at?: string
          id?: string
          page: string
        }
        Update: {
          changed_by?: string | null
          content_group?: string
          content_id?: string
          content_key?: string
          content_label?: string
          content_value?: string
          created_at?: string
          id?: string
          page?: string
        }
        Relationships: []
      }
      page_elements: {
        Row: {
          created_at: string
          element_group: string
          element_key: string
          element_label: string
          id: string
          is_visible: boolean
          page: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          element_group?: string
          element_key: string
          element_label: string
          id?: string
          is_visible?: boolean
          page: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          element_group?: string
          element_key?: string
          element_label?: string
          id?: string
          is_visible?: boolean
          page?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      portal_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          is_active: boolean
          tab_access: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          is_active?: boolean
          tab_access?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          is_active?: boolean
          tab_access?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portal_tools: {
        Row: {
          category: string
          color: string | null
          config: Json | null
          created_at: string
          description: string | null
          features: string[]
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          tool_type: string
          user_id: string
        }
        Insert: {
          category?: string
          color?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          features?: string[]
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          tool_type: string
          user_id: string
        }
        Update: {
          category?: string
          color?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          features?: string[]
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          tool_type?: string
          user_id?: string
        }
        Relationships: []
      }
      system_issues: {
        Row: {
          area: string
          created_at: string
          fix: string
          id: string
          impact: string
          is_resolved: boolean
          issue: string
          severity: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          area?: string
          created_at?: string
          fix?: string
          id?: string
          impact?: string
          is_resolved?: boolean
          issue?: string
          severity?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          fix?: string
          id?: string
          impact?: string
          is_resolved?: boolean
          issue?: string
          severity?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tool_attributes: {
        Row: {
          created_at: string
          id: string
          key: string
          tool_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          tool_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          tool_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_attributes_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "portal_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_scripts: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          is_verified: boolean
          last_verified_at: string | null
          name: string
          position: string
          script_type: string
          sort_order: number
          updated_at: string
          verification_method: string
        }
        Insert: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          last_verified_at?: string | null
          name: string
          position?: string
          script_type?: string
          sort_order?: number
          updated_at?: string
          verification_method?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          last_verified_at?: string | null
          name?: string
          position?: string
          script_type?: string
          sort_order?: number
          updated_at?: string
          verification_method?: string
        }
        Relationships: []
      }
      unhandled_intents: {
        Row: {
          created_at: string
          fast_route_score: number | null
          id: string
          llm_confidence: number | null
          llm_intent: string | null
          resolved: boolean
          resolved_workflow: string | null
          source: string
          user_input: string
        }
        Insert: {
          created_at?: string
          fast_route_score?: number | null
          id?: string
          llm_confidence?: number | null
          llm_intent?: string | null
          resolved?: boolean
          resolved_workflow?: string | null
          source?: string
          user_input: string
        }
        Update: {
          created_at?: string
          fast_route_score?: number | null
          id?: string
          llm_confidence?: number | null
          llm_intent?: string | null
          resolved?: boolean
          resolved_workflow?: string | null
          source?: string
          user_input?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          action: string
          created_at: string
          description: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_ai_access: {
        Row: {
          ai_model: string
          can_access: boolean
          granted_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          ai_model: string
          can_access?: boolean
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          ai_model?: string
          can_access?: boolean
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_content_access: {
        Row: {
          can_edit: boolean
          can_view: boolean
          content_type: string
          granted_at: string
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          content_type: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          content_type?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tool_access: {
        Row: {
          can_use: boolean
          can_view: boolean
          granted_at: string
          granted_by: string | null
          id: string
          tool_id: string
          user_id: string
        }
        Insert: {
          can_use?: boolean
          can_view?: boolean
          granted_at?: string
          granted_by?: string | null
          id?: string
          tool_id: string
          user_id: string
        }
        Update: {
          can_use?: boolean
          can_view?: boolean
          granted_at?: string
          granted_by?: string | null
          id?: string
          tool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tool_access_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "portal_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          result_data: Json | null
          status: Database["public"]["Enums"]["workflow_run_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          result_data?: Json | null
          status?: Database["public"]["Enums"]["workflow_run_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          result_data?: Json | null
          status?: Database["public"]["Enums"]["workflow_run_status"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      workflow_run_status: "pending" | "processing" | "completed" | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      workflow_run_status: ["pending", "processing", "completed", "error"],
    },
  },
} as const
