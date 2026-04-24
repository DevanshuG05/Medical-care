import {
  Activity,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Pill,
  Plus,
  Search,
  Settings,
  Stethoscope,
  User,
  Users,
  X,
  Bell,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clipboard,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  GraduationCap,
  Award,
  Star,
  Filter,
  MoreVertical,
  RefreshCw,
  Brain,
} from 'lucide-react'

export const Icons = {
  activity: Activity,
  calendar: Calendar,
  calendarDays: CalendarDays,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  clock: Clock,
  fileText: FileText,
  heart: Heart,
  home: Home,
  logOut: LogOut,
  menu: Menu,
  messageSquare: MessageSquare,
  pill: Pill,
  plus: Plus,
  search: Search,
  settings: Settings,
  stethoscope: Stethoscope,
  user: User,
  users: Users,
  close: X,
  bell: Bell,
  checkCircle: CheckCircle,
  alertCircle: AlertCircle,
  trendingUp: TrendingUp,
  clipboard: Clipboard,
  upload: Upload,
  download: Download,
  eye: Eye,
  edit: Edit,
  trash: Trash2,
  phone: Phone,
  mail: Mail,
  mapPin: MapPin,
  building: Building,
  graduationCap: GraduationCap,
  award: Award,
  star: Star,
  filter: Filter,
  moreVertical: MoreVertical,
  refresh: RefreshCw,
  brain: Brain,
  logo: ({ className }: { className?: string }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L4 6v12l8 4 8-4V6l-8-4z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
}
