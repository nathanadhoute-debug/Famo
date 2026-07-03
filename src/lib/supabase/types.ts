// Types générés manuellement depuis le schéma Famō
// Équivalent à : supabase gen types typescript --project-id gsrprbmiaxkwxyunjjvc

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id:                     string
          name:                   string
          created_by:             string | null
          created_at:             string
          stripe_customer_id:     string | null
          stripe_subscription_id: string | null
          subscription_status:    string
        }
        Insert: {
          id?:                     string
          name:                    string
          created_by?:             string | null
          created_at?:             string
          stripe_customer_id?:     string | null
          stripe_subscription_id?: string | null
          subscription_status?:    string
        }
        Update: {
          id?:                     string
          name?:                   string
          created_by?:             string | null
          stripe_customer_id?:     string | null
          stripe_subscription_id?: string | null
          subscription_status?:    string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          id:        string
          family_id: string
          user_id:   string
          role:      'admin' | 'member' | 'readonly'
          joined_at: string
        }
        Insert: {
          id?:        string
          family_id:  string
          user_id:    string
          role?:      'admin' | 'member' | 'readonly'
          joined_at?: string
        }
        Update: {
          role?: 'admin' | 'member' | 'readonly'
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id:         string
          full_name:  string | null
          avatar_url: string | null
          updated_at: string
        }
        Insert: {
          id:          string
          full_name?:  string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Update: {
          full_name?:  string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          id:          string
          family_id:   string
          invited_by:  string
          email:       string
          role:        'admin' | 'member' | 'readonly'
          token:       string
          accepted_at: string | null
          expires_at:  string
          created_at:  string
        }
        Insert: {
          id?:          string
          family_id:    string
          invited_by:   string
          email:        string
          role?:        'admin' | 'member' | 'readonly'
          token?:       string
          accepted_at?: string | null
          expires_at?:  string
          created_at?:  string
        }
        Update: {
          accepted_at?: string | null
        }
        Relationships: []
      }
      parents: {
        Row: {
          id:         string
          family_id:  string
          name:       string
          birth_date: string | null
          notes:      string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?:         string
          family_id:   string
          name:        string
          birth_date?: string | null
          notes?:      string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          name?:       string
          birth_date?: string | null
          notes?:      string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      visits: {
        Row: {
          id:         string
          family_id:  string
          parent_id:  string
          visitor_id: string | null
          visit_date: string
          note:       string | null
          created_at: string
        }
        Insert: {
          id?:         string
          family_id:   string
          parent_id:   string
          visitor_id?: string | null
          visit_date:  string
          note?:       string | null
          created_at?: string
        }
        Update: {
          visitor_id?: string | null
          note?:       string | null
        }
        Relationships: []
      }
      medications: {
        Row: {
          id:            string
          family_id:     string
          parent_id:     string
          name:          string
          dose:          string
          category:      string
          critical:      boolean
          rx_label:      string | null
          rx_expires_at: string | null
          active:        boolean
          created_at:    string
        }
        Insert: {
          id?:            string
          family_id:      string
          parent_id:      string
          name:           string
          dose:           string
          category?:      string
          critical?:      boolean
          rx_label?:      string | null
          rx_expires_at?: string | null
          active?:        boolean
          created_at?:    string
        }
        Update: {
          name?:          string
          dose?:          string
          category?:      string
          critical?:      boolean
          rx_label?:      string | null
          rx_expires_at?: string | null
          active?:        boolean
        }
        Relationships: []
      }
      medication_schedules: {
        Row: {
          id:             string
          medication_id:  string
          scheduled_time: string
        }
        Insert: {
          id?:             string
          medication_id:   string
          scheduled_time:  string
        }
        Update: {
          scheduled_time?: string
        }
        Relationships: []
      }
      doses: {
        Row: {
          id:            string
          schedule_id:   string
          medication_id: string
          family_id:     string
          dose_date:     string
          given:         boolean
          given_by:      string | null
          given_at:      string | null
          note:          string | null
          created_at:    string
        }
        Insert: {
          id?:            string
          schedule_id:    string
          medication_id:  string
          family_id:      string
          dose_date:      string
          given?:         boolean
          given_by?:      string | null
          given_at?:      string | null
          note?:          string | null
          created_at?:    string
        }
        Update: {
          given?:    boolean
          given_by?: string | null
          given_at?: string | null
          note?:     string | null
        }
        Relationships: []
      }
      vitals: {
        Row: {
          id:          string
          family_id:   string
          parent_id:   string
          recorded_by: string | null
          label:       string
          value:       string
          unit:        string | null
          icon:        string | null
          recorded_at: string
        }
        Insert: {
          id?:          string
          family_id:    string
          parent_id:    string
          recorded_by?: string | null
          label:        string
          value:        string
          unit?:        string | null
          icon?:        string | null
          recorded_at?: string
        }
        Update: {
          label?:       string
          value?:       string
          unit?:        string | null
          icon?:        string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          id:         string
          family_id:  string
          parent_id:  string
          label:      string
          prescriber: string | null
          issued_at:  string | null
          expires_at: string | null
          file_url:   string | null
          created_at: string
        }
        Insert: {
          id?:         string
          family_id:   string
          parent_id:   string
          label:       string
          prescriber?: string | null
          issued_at?:  string | null
          expires_at?: string | null
          file_url?:   string | null
          created_at?: string
        }
        Update: {
          label?:      string
          prescriber?: string | null
          issued_at?:  string | null
          expires_at?: string | null
          file_url?:   string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          id:         string
          family_id:  string
          parent_id:  string
          author_id:  string
          content:    string
          tags:       string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?:         string
          family_id:   string
          parent_id:   string
          author_id:   string
          content:     string
          tags?:       string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?:    string
          tags?:       string[]
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id:          string
          family_id:   string
          parent_id:   string
          uploaded_by: string | null
          category:    string
          label:       string
          file_url:    string
          file_size:   number | null
          mime_type:   string | null
          created_at:  string
        }
        Insert: {
          id?:          string
          family_id:    string
          parent_id:    string
          uploaded_by?: string | null
          category?:    string
          label:        string
          file_url:     string
          file_size?:   number | null
          mime_type?:   string | null
          created_at?:  string
        }
        Update: {
          label?:     string
          category?:  string
          file_url?:  string
        }
        Relationships: []
      }
      medical_contacts: {
        Row: {
          id:           string
          family_id:    string
          parent_id:    string
          name:         string
          role:         string
          phone:        string | null
          email:        string | null
          address:      string | null
          is_emergency: boolean
          created_at:   string
        }
        Insert: {
          id?:           string
          family_id:     string
          parent_id:     string
          name:          string
          role:          string
          phone?:        string | null
          email?:        string | null
          address?:      string | null
          is_emergency?: boolean
          created_at?:   string
        }
        Update: {
          name?:         string
          role?:         string
          phone?:        string | null
          email?:        string | null
          address?:      string | null
          is_emergency?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      today_doses: {
        Row: {
          id:             string
          dose_date:      string
          given:          boolean
          given_by:       string | null
          given_at:       string | null
          schedule_id:    string
          medication_id:  string
          family_id:      string
          parent_id:      string
          med_name:       string
          med_dose:       string
          category:       string
          critical:       boolean
          scheduled_time: string
          is_overdue:     boolean
          given_by_name:  string | null
        }
        Relationships: []
      }
      week_visits: {
        Row: {
          id:           string
          visit_date:   string
          visitor_id:   string | null
          note:         string | null
          parent_id:    string
          family_id:    string
          visitor_name: string | null
          day_offset:   number
        }
        Relationships: []
      }
    }
    Functions: {
      generate_daily_doses: {
        Args:    { target_date?: string }
        Returns: undefined
      }
      expiring_prescriptions: {
        Args:    { days_ahead?: number }
        Returns: {
          prescription_id: string
          family_id:       string
          parent_name:     string
          rx_label:        string
          expires_at:      string
        }[]
      }
      is_family_member: {
        Args:    { fid: string }
        Returns: boolean
      }
      is_family_admin: {
        Args:    { fid: string }
        Returns: boolean
      }
    }
    Enums: {
      member_role:   'admin' | 'member' | 'readonly'
      med_category:  'Cardiologie' | 'Diabète' | 'Antalgique' | 'Neurologie' | 'Pneumologie' | 'Rhumatologie' | 'Autre'
      journal_tag:   'santé' | 'rdv' | 'humeur' | 'repas' | 'urgence' | 'note' | 'médicament'
      doc_category:  'Ordonnance' | 'Analyse' | 'Compte-rendu' | 'Identité' | 'Assurance' | 'Autre'
    }
    CompositeTypes: Record<string, never>
  }
}
