"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface CalendarContextType {
  isBS: boolean;
  toggleCalendar: () => void;
}

const CalendarContext = createContext<CalendarContextType>({
  isBS: false,
  toggleCalendar: () => {},
});

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [isBS, setIsBS] = useState(false);
  const toggleCalendar = () => setIsBS((prev) => !prev);
  return (
    <CalendarContext.Provider value={{ isBS, toggleCalendar }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  return useContext(CalendarContext);
}
