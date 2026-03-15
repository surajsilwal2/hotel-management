"use client";
import { adToBS, formatBS, formatBSShort } from "@/lib/nepali-date";
import { useCalendar } from "@/components/CalendarContext";
import { format } from "date-fns";

interface BsDateDisplayProps {
  date: Date | string;
  showBoth?: boolean;  // show "15 Mar 2026 (1 Chaitra 2082 BS)"
  short?: boolean;     // show "2082/01/15" instead of "1 Chaitra 2082"
  className?: string;
}

export default function BsDateDisplay({
  date,
  showBoth = false,
  short = false,
  className = "",
}: BsDateDisplayProps) {
  const { isBS } = useCalendar();
  const d = typeof date === "string" ? new Date(date) : date;

  if (!isBS) {
    return (
      <span className={className}>
        {format(d, "dd MMM yyyy")}
      </span>
    );
  }

  const bs = adToBS(d);

  if (showBoth) {
    return (
      <span className={className}>
        {format(d, "dd MMM yyyy")}
        <span className="text-amber-600 font-medium ml-1">
          ({short ? formatBSShort(bs) : formatBS(bs)} BS)
        </span>
      </span>
    );
  }

  return (
    <span className={className} title={`AD: ${format(d, "dd MMM yyyy")}`}>
      {short ? formatBSShort(bs) : formatBS(bs)}
      <span className="text-xs text-slate-400 ml-1">BS</span>
    </span>
  );
}
