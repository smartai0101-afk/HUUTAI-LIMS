import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));

export const isExpiringSoon = (date: string) => {
  const diff = new Date(date).getTime() - new Date().getTime();
  return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
};

export const isExpired = (date: string) => new Date(date) < new Date();
