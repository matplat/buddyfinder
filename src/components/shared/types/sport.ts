export interface UserSportViewModel {
  sport_id: number;
  sport_name: string;
  custom_range_km: number | null;
  params: Record<string, string | number>;
}