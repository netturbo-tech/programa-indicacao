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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contatos: {
        Row: {
          celular: string
          cnpj: string
          created_at: string
          criado_por_id: string
          criado_por_nome: string
          email: string
          id: string
          modificado_por_nome: string
          nome: string
          nome_fantasia: string
          observacao: string
          razao_social: string
          telefone_fixo: string
          updated_at: string
        }
        Insert: {
          celular?: string
          cnpj?: string
          created_at?: string
          criado_por_id: string
          criado_por_nome: string
          email?: string
          id?: string
          modificado_por_nome: string
          nome: string
          nome_fantasia?: string
          observacao?: string
          razao_social?: string
          telefone_fixo?: string
          updated_at?: string
        }
        Update: {
          celular?: string
          cnpj?: string
          created_at?: string
          criado_por_id?: string
          criado_por_nome?: string
          email?: string
          id?: string
          modificado_por_nome?: string
          nome?: string
          nome_fantasia?: string
          observacao?: string
          razao_social?: string
          telefone_fixo?: string
          updated_at?: string
        }
        Relationships: []
      }
      indicacoes: {
        Row: {
          contrato: Database["public"]["Enums"]["contrato_tipo"]
          created_at: string
          criado_por_id: string
          criado_por_nome: string
          email_indicador: string
          email_lead: string
          empresa: string
          funcao: string
          id: string
          lead_nome: string
          modificado_por_nome: string
          observacao: string
          produto: Database["public"]["Enums"]["produto_tipo"]
          recompensa_paga: boolean
          setor: Database["public"]["Enums"]["setor_tipo"]
          status: Database["public"]["Enums"]["status_indicacao"]
          telefone: string
          updated_at: string
        }
        Insert: {
          contrato: Database["public"]["Enums"]["contrato_tipo"]
          created_at?: string
          criado_por_id: string
          criado_por_nome: string
          email_indicador: string
          email_lead?: string
          empresa: string
          funcao?: string
          id?: string
          lead_nome: string
          modificado_por_nome: string
          observacao?: string
          produto: Database["public"]["Enums"]["produto_tipo"]
          recompensa_paga?: boolean
          setor: Database["public"]["Enums"]["setor_tipo"]
          status?: Database["public"]["Enums"]["status_indicacao"]
          telefone?: string
          updated_at?: string
        }
        Update: {
          contrato?: Database["public"]["Enums"]["contrato_tipo"]
          created_at?: string
          criado_por_id?: string
          criado_por_nome?: string
          email_indicador?: string
          email_lead?: string
          empresa?: string
          funcao?: string
          id?: string
          lead_nome?: string
          modificado_por_nome?: string
          observacao?: string
          produto?: Database["public"]["Enums"]["produto_tipo"]
          recompensa_paga?: boolean
          setor?: Database["public"]["Enums"]["setor_tipo"]
          status?: Database["public"]["Enums"]["status_indicacao"]
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          contrato: Database["public"]["Enums"]["contrato_tipo"]
          cpf: string | null
          created_at: string
          email: string
          funcao: string
          id: string
          login_identifier: string | null
          name: string
          onboarding_completed: boolean
          ra: string | null
          setor: Database["public"]["Enums"]["setor_tipo"]
          updated_at: string
          user_id: string
        }
        Insert: {
          contrato?: Database["public"]["Enums"]["contrato_tipo"]
          cpf?: string | null
          created_at?: string
          email: string
          funcao?: string
          id?: string
          login_identifier?: string | null
          name: string
          onboarding_completed?: boolean
          ra?: string | null
          setor?: Database["public"]["Enums"]["setor_tipo"]
          updated_at?: string
          user_id: string
        }
        Update: {
          contrato?: Database["public"]["Enums"]["contrato_tipo"]
          cpf?: string | null
          created_at?: string
          email?: string
          funcao?: string
          id?: string
          login_identifier?: string | null
          name?: string
          onboarding_completed?: boolean
          ra?: string | null
          setor?: Database["public"]["Enums"]["setor_tipo"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      indicacao_update_allowed: {
        Args: {
          _contrato: Database["public"]["Enums"]["contrato_tipo"]
          _criado_por_id: string
          _criado_por_nome: string
          _email_indicador: string
          _email_lead: string
          _empresa: string
          _funcao: string
          _id: string
          _lead_nome: string
          _modificado_por_nome: string
          _observacao: string
          _produto: Database["public"]["Enums"]["produto_tipo"]
          _recompensa_paga: boolean
          _setor: Database["public"]["Enums"]["setor_tipo"]
          _status: Database["public"]["Enums"]["status_indicacao"]
          _telefone: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "aprovador" | "usuario" | "usuario_ra"
      contrato_tipo: "CLT" | "PJ"
      produto_tipo:
        | "Conectividade"
        | "Wifi"
        | "Firewall"
        | "Switch"
        | "Backup"
        | "VOZ"
      setor_tipo:
        | "GT"
        | "BACK OFFICE"
        | "COMERCIAL"
        | "COMPRAS"
        | "FINANCEIRO"
        | "IMPLANTAÇÃO"
        | "LOGÍSTICA"
        | "MANUTENÇÃO"
        | "MARKETING"
        | "NOC"
        | "NT TECH"
        | "O&M"
        | "PROCESSO E QUALIDADE"
        | "PROJETOS"
        | "TI"
      status_indicacao:
        | "Indicado"
        | "Qualificado"
        | "Desqualificado"
        | "Reunião agendada"
        | "Reunião realizada"
        | "Proposta em análise"
        | "Contrato assinado"
        | "Venda perdida"
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
      app_role: ["admin", "aprovador", "usuario", "usuario_ra"],
      contrato_tipo: ["CLT", "PJ"],
      produto_tipo: [
        "Conectividade",
        "Wifi",
        "Firewall",
        "Switch",
        "Backup",
        "VOZ",
      ],
      setor_tipo: [
        "GT",
        "BACK OFFICE",
        "COMERCIAL",
        "COMPRAS",
        "FINANCEIRO",
        "IMPLANTAÇÃO",
        "LOGÍSTICA",
        "MANUTENÇÃO",
        "MARKETING",
        "NOC",
        "NT TECH",
        "O&M",
        "PROCESSO E QUALIDADE",
        "PROJETOS",
        "TI",
      ],
      status_indicacao: [
        "Indicado",
        "Qualificado",
        "Desqualificado",
        "Reunião agendada",
        "Reunião realizada",
        "Proposta em análise",
        "Contrato assinado",
        "Venda perdida",
      ],
    },
  },
} as const
