export interface Team {
  id: string;
  name: string;
  createdAt: string;
}

export interface Member {
  id: string;
  teamId: string;
  name: string;
  isPreset: boolean;
}

export interface SignatureStroke {
  points: { x: number; y: number }[];
}

export type SignatureData = SignatureStroke[];

export interface Record {
  id: string;
  memberId: string;
  teamId: string;
  type: "in" | "out";
  time: string;
  signature: string | null;
}

export interface MemberStatus {
  id: string;
  name: string;
  status: "in" | "out" | "none";
  lastCheckIn: string | null;
  lastCheckOut: string | null;
  lastSignatureIn: SignatureData | null;
  lastSignatureOut: SignatureData | null;
}

export interface TeamStatus {
  team: Team;
  members: MemberStatus[];
  stats: {
    present: number;
    absent: number;
    gone: number;
    total: number;
  };
}
