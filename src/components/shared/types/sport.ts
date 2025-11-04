export interface UserSportViewModel {
  id: string;
  sport_id: string;
  sport_name: string;
  custom_range_km: number | null;
  params: Record<string, string | number>;
}