/**
 * Minimal hand-written Database types for openImpact.
 * Regenerate with `supabase gen types typescript` once the remote project exists.
 */
export type UserRole = "donor" | "recipient" | "organisation";
export type DonationStatus = "pending" | "received" | "verified" | "flagged";
export type ProofScope = "donation" | "general";
export type PublicationType = "social" | "news" | "blog" | "other";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          name: string;
          wallet_address: string | null;
          location: string | null;
          is_demo: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          name: string;
          wallet_address?: string | null;
          location?: string | null;
          is_demo?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      organisations: {
        Row: {
          id: string;
          profile_id: string | null;
          name: string;
          tagline: string;
          description: string;
          image_url: string;
          wallet_address: string | null;
          reputation_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          name: string;
          tagline?: string;
          description?: string;
          image_url?: string;
          wallet_address?: string | null;
          reputation_score?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organisations"]["Insert"]>;
      };
      recipients: {
        Row: {
          id: string;
          profile_id: string | null;
          pseudonym: string;
          org_id: string | null;
          story: string;
          wallet_address: string | null;
          reputation_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          pseudonym: string;
          org_id?: string | null;
          story?: string;
          wallet_address?: string | null;
          reputation_score?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recipients"]["Insert"]>;
      };
      donations: {
        Row: {
          id: string;
          donor_profile_id: string | null;
          donor_name: string;
          is_public: boolean;
          amount: number;
          currency: string;
          recipient_id: string;
          org_id: string | null;
          status: DonationStatus;
          tx_hash: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          donor_profile_id?: string | null;
          donor_name: string;
          is_public?: boolean;
          amount: number;
          currency?: string;
          recipient_id: string;
          org_id?: string | null;
          status?: DonationStatus;
          tx_hash?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["donations"]["Insert"]>;
      };
      proofs: {
        Row: {
          id: string;
          scope: ProofScope;
          donation_id: string | null;
          recipient_id: string;
          donor_name: string | null;
          donor_is_public: boolean | null;
          org_id: string | null;
          photo_url: string;
          description: string;
          testimonial: string;
          submitted_at: string;
          flagged: boolean;
          ai_checked: boolean | null;
          ai_reason: string | null;
          ai_internal_note: string | null;
        };
        Insert: {
          id?: string;
          scope: ProofScope;
          donation_id?: string | null;
          recipient_id: string;
          donor_name?: string | null;
          donor_is_public?: boolean | null;
          org_id?: string | null;
          photo_url: string;
          description?: string;
          testimonial?: string;
          submitted_at?: string;
          flagged?: boolean;
          ai_checked?: boolean | null;
          ai_reason?: string | null;
          ai_internal_note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["proofs"]["Insert"]>;
      };
      proof_donor_shares: {
        Row: {
          proof_id: string;
          contact: string | null;
          social: string | null;
          note: string | null;
        };
        Insert: {
          proof_id: string;
          contact?: string | null;
          social?: string | null;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["proof_donor_shares"]["Insert"]>;
      };
      publications: {
        Row: {
          id: string;
          donation_id: string;
          url: string;
          type: PublicationType;
          caption: string | null;
          submitted_at: string;
          submitted_by: string | null;
        };
        Insert: {
          id?: string;
          donation_id: string;
          url: string;
          type?: PublicationType;
          caption?: string | null;
          submitted_at?: string;
          submitted_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["publications"]["Insert"]>;
      };
      invites: {
        Row: {
          code: string;
          org_id: string;
          project_label: string;
          amount: number | null;
          note: string | null;
          created_at: string;
          used_by_profile_id: string | null;
          claimed_pseudonym: string | null;
          claimed_wallet: string | null;
          claimed_at: string | null;
        };
        Insert: {
          code: string;
          org_id: string;
          project_label: string;
          amount?: number | null;
          note?: string | null;
          created_at?: string;
          used_by_profile_id?: string | null;
          claimed_pseudonym?: string | null;
          claimed_wallet?: string | null;
          claimed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["invites"]["Insert"]>;
      };
    };
    Views: {
      proofs_public: {
        Row: {
          id: string;
          scope: ProofScope;
          donation_id: string | null;
          recipient_id: string;
          donor_name: string | null;
          donor_is_public: boolean | null;
          org_id: string | null;
          photo_url: string;
          description: string;
          testimonial: string;
          submitted_at: string;
          flagged: boolean;
          ai_checked: boolean | null;
          ai_reason: string | null;
        };
      };
      proofs_org_brief: {
        Row: {
          id: string;
          scope: ProofScope;
          donation_id: string | null;
          recipient_id: string;
          org_id: string | null;
          submitted_at: string;
          flagged: boolean;
          ai_checked: boolean | null;
          ai_reason: string | null;
          brief: string;
        };
      };
      recipients_public: {
        Row: Database["public"]["Tables"]["recipients"]["Row"];
      };
    };
    Functions: {
      org_trust_score: { Args: { p_org_id: string }; Returns: number };
      generate_pseudonym: { Args: Record<string, never>; Returns: string };
      complete_signup: {
        Args: {
          p_role: UserRole;
          p_name: string;
          p_invite_code?: string | null;
          p_org_id?: string | null;
        };
        Returns: {
          role: UserRole;
          entityId: string | null;
          walletAddress: string;
          pseudonym: string | null;
        };
      };
    };
  };
}
