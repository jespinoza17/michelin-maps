export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          name: string
          address: string
          location: string
          city: string
          country: string
          stars: 1 | 2 | 3
          cuisine: string
          price_level: 1 | 2 | 3 | 4
          latitude: number
          longitude: number
          phone: string | null
          website: string | null
          michelin_url: string | null
          green_star: boolean
          facilities: string[] | null
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          location: string
          city: string
          country: string
          stars: 1 | 2 | 3
          cuisine: string
          price_level: 1 | 2 | 3 | 4
          latitude: number
          longitude: number
          phone?: string | null
          website?: string | null
          michelin_url?: string | null
          green_star?: boolean
          facilities?: string[] | null
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          location?: string
          city?: string
          country?: string
          stars?: 1 | 2 | 3
          cuisine?: string
          price_level?: 1 | 2 | 3 | 4
          latitude?: number
          longitude?: number
          phone?: string | null
          website?: string | null
          michelin_url?: string | null
          green_star?: boolean
          facilities?: string[] | null
          description?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      restaurants_with_distance: {
        Row: {
          id: string
          name: string
          address: string
          location: string
          city: string
          country: string
          stars: 1 | 2 | 3
          cuisine: string
          price_level: 1 | 2 | 3 | 4
          latitude: number
          longitude: number
          phone: string | null
          website: string | null
          michelin_url: string | null
          green_star: boolean
          facilities: string[] | null
          description: string
          created_at: string
          updated_at: string
          award_display: string
          price_display: string
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}