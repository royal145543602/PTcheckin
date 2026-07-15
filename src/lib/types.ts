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

export interface Record {
  id: string;
  memberId: string;
  teamId: string;
  type: "in" | "out";
  time: string;
}

export interface MemberStatus {
  id: string;
  name: string;
  status: "in" | "out" | "none";
  lastCheckIn: string | null;
  lastCheckOut: string | null;
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
