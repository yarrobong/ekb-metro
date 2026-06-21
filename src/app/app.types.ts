export type AppScreen =
  | "stations"
  | "trains"
  | "schedule"
  | "arrival-plan"
  | "settings"
  | "about"
  | "install";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}
