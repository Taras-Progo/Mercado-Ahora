import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function LeafIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 14-9-1 9-4 16-9 16Z" />
      <path d="M4 20c3-3 5.5-4.5 9-6.5" />
    </svg>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M21 12a8 8 0 1 1-3.1-6.32L21 4l-1 4.17A7.95 7.95 0 0 1 21 12Z" />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" />
    </svg>
  );
}

export function BagIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} fill="currentColor" stroke="none">
      <path d="m12 2 3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7L12 2Z" />
    </svg>
  );
}

export function HandshakeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 12 8 7l3 3 3-3 5 5-5 5-3-3-3 3-5-5Z" />
      <path d="m11 10 2 2" />
    </svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20c1-3.5 4-5.5 7-5.5s6 2 7 5.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M22 20c-.7-2.7-2.7-4-5-4" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function HeartFilledIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} fill="currentColor" stroke="none">
      <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" />
    </svg>
  );
}

export function CategoryVaseIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M9 4h6v2c0 2 2 3 2 6s-2 8-5 8-5-5-5-8 2-4 2-6V4Z" />
    </svg>
  );
}

export function CategoryShirtIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 6 4 9l3 2v9h10v-9l3-2-2-3-4-1c0 1.5-1.3 2.5-3 2.5S8.5 6.5 8.5 5L6 6Z" />
    </svg>
  );
}

export function CategoryJarIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M8 3h8v3H8z" />
      <path d="M7 7h10v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7Z" />
      <path d="M9 12h6" />
    </svg>
  );
}

export function CategoryPlantIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 11c0-4-3-6-7-6 0 4 3 6 7 6Z" />
      <path d="M12 11c0-3 2.5-5 6-5 0 3-2.5 5-6 5Z" />
      <path d="M12 11v9" />
      <path d="M8 21h8" />
    </svg>
  );
}

export function CategoryShopIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 9 5 5h14l2 4" />
      <path d="M4 9h16v11H4z" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

export function CategoryToolsIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m6 4 4 4-3 3-4-4 3-3Z" />
      <path d="m11 9 7 7-3 3-7-7" />
      <path d="m18 4 3 3-2 2-3-3 2-2Z" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1 2H5l1-2Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function PackageIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 7 12 3l9 4-9 4-9-4Z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}

export function TrendingUpIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6m0-6-6 6" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9v6M14 9v6" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2 2h3l2.5 12a2 2 0 0 0 2 1.5h9a2 2 0 0 0 2-1.5L23 6H6" />
    </svg>
  );
}

export function LightningIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  );
}
