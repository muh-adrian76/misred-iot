Folder `src` berisi seluruh kode sumber frontend untuk aplikasi web MiSREd IoT. Struktur ini mengikuti pola **Perute Aplikasi Next.js** dengan organisasi yang jelas antara routing, komponen UI, logika bisnis, dan utilitas.

## 📁 Gambaran Besar Struktur Kode Sumber

```
src/
├── app/                            # 🛣️ Perute Aplikasi - Routing dan layouts
├── components/                     # 🧩 Komponen UI - Komponen yang dapat digunakan ulang
├── hooks/                          # 🎣 Hook Kustom - Logika state React
├── lib/                           # 🔧 Pustaka - Fungsi pembantu
└── providers/                     # 🌐 Penyedia Konteks - State global
```

## 🛣️ Perute Aplikasi (folder `app/`)

Folder `app` menggunakan **Perute Aplikasi Next.js 14** yang mengorganisir routing berdasarkan struktur berkas. Setiap folder merepresentasikan rute, dengan konvensi khusus untuk layout dan halaman.

### Struktur Routing

```
app/
├── globals.css                     # 🎨 Gaya global Tailwind CSS
├── layout.js                       # 📐 Layout akar untuk semua halaman
├── loading.js                      # ⏳ Komponen pemuatan global
├── not-found.js                    # Halaman tidak ditemukan 404
├── page.js                         # 🏠 Halaman arahan (/)
├── 404-layout.jsx                  # 📐 Layout khusus halaman 404
├── manifest.json                   # 📱 Konfigurasi manifes PWA
├── (admin)/                        # 👑 Rute khusus admin
├── (user)/                         # 👤 Rute dasbor pengguna
├── 401/                           # 🚫 Halaman akses tidak diotorisasi
├── auth/                          # 🔐 Halaman autentikasi
└── api/                           # 🌐 Rute API (API Next.js)
```

### Penjelasan Detail Perute Aplikasi

#### 🏠 **Halaman Akar**
- **`page.js`**: Halaman arahan dengan bagian hero, tinjauan fitur, dan ajakan bertindak
- **`layout.js`**: Layout akar yang membungkus semua halaman dengan penyedia dan gaya global
- **`loading.js`**: State pemuatan yang ditampilkan saat navigasi halaman
- **`not-found.js`**: Halaman kesalahan 404 dengan navigasi kembali ke beranda
- **`globals.css`**: Gaya global Tailwind CSS dan variabel CSS kustom

#### 👑 **Rute Admin (`(admin)/`)**
**Fungsi:** Antarmuka khusus administrator sistem

```
(admin)/
├── layout.jsx                      # Admin layout dengan navigation
├── client.jsx                      # Client component wrapper
├── maps/                          # 🗺️ Location mapping features
├── otaa/                          # 📡 OTA firmware management  
├── overviews/                     # 📊 System overview dan statistics
└── users/                         # 👥 User management interface
```

**Fitur Admin:**
- **Maps**: Visualisasi lokasi device pada peta interaktif
- **OTAA**: Upload dan deploy firmware ke IoT devices
- **Overviews**: Dashboard statistik sistem, user activity, device status
- **Users**: CRUD users, role management, user activity monitoring

#### 👤 **User Routes (`(user)/`)**
**Fungsi:** Dashboard utama untuk end users

```
(user)/
├── layout.jsx                      # User dashboard layout
├── client.jsx                      # Client component wrapper
├── alarms/                        # 🚨 Alarm management pages
├── dashboards/                    # 📊 Custom dashboard builder
├── datastreams/                   # 📡 Sensor configuration pages
└── devices/                       # 🔌 Device management pages
```

**Fitur User:**
- **Alarms**: Create, edit alarm rules dengan kondisi threshold
- **Dashboards**: Drag-and-drop dashboard builder dengan widgets
- **Datastreams**: Konfigurasi sensor/aktuator pada device
- **Devices**: CRUD devices, monitor status, send commands

#### 🔐 **Authentication (`auth/`)**
**Fungsi:** Authentication dan authorization flows
- Login/register forms dengan validasi
- Google OAuth integration
- Password reset functionality
- Profile management

#### 🚫 **Error Pages (`401/`)**
**Fungsi:** Error handling untuk unauthorized access
- Styled error page dengan navigation options
- Role-based access denied messages

#### 🌐 **API Routes (`api/`)**
**Fungsi:** Next.js API routes untuk client-side operations
- **`resend/`**: Email sending via Resend API
- Integration dengan external services yang perlu client-side access

## 🧩 UI Components (`components/` folder)

Folder `components` diorganisir dalam hierarki yang jelas: **custom components**, **feature-specific components**, dan **base UI components**.

### Struktur Komponen

```
components/
├── custom/                         # 🎨 Custom components aplikasi
├── features/                       # 🚀 Feature-specific components  
└── ui/                            # 🧱 Base UI components (shadcn/ui)
```

### Custom Components (`custom/` subfolder)

#### **Buttons (`buttons/`)**
**Fungsi:** Custom button variants untuk aplikasi
- Primary/secondary button styles
- Loading states dan disabled states
- Icon buttons dengan tooltips
- Action buttons dengan confirmations

#### **Dialogs (`dialogs/`)**
**Fungsi:** Modal dialogs untuk berbagai use cases
- Confirmation dialogs (delete, save, etc.)
- Form dialogs untuk CRUD operations
- Alert dialogs untuk notifications
- Multi-step wizard dialogs

#### **Forms (`forms/`)**
**Fungsi:** Complex form components dengan validasi
- Device registration forms
- Sensor configuration forms
- User profile forms
- Settings dan preferences forms

#### **Icons (`icons/`)**
**Fungsi:** Custom icon components
- SVG icon wrappers
- Animated icons untuk loading states
- Status indicator icons
- Feature-specific icons (device, alarm, etc.)

#### **Maps (`maps/`)**
**Fungsi:** Interactive map components
- Device location plotting
- Geofencing visualization
- Map controls dan overlays
- Location picker components

#### **Other (`other/`)**
**Fungsi:** Miscellaneous custom components
- File upload components
- Export utilities (PDF, CSV)
- Notification toasts
- Breadcrumb navigation

#### **Tables (`tables/`)**
**Fungsi:** Data table components dengan advanced features
- Sortable columns
- Pagination controls
- Filtering dan search
- Bulk actions dan selection

#### **Widgets (`widgets/`)**
**Fungsi:** Dashboard widget components
- Chart widgets (line, bar, pie, gauge)
- Data display widgets
- Control widgets untuk aktuator
- Widget configuration panels

### Feature Components (`features/` subfolder)

#### **Global Layout Components**
- **`app-navbar.jsx`**: Top navigation bar dengan user menu
- **`app-sidebar.jsx`**: Side navigation dengan route highlights
- **`loader-text.jsx`**: Loading component dengan animated text
- **`nav-dropdown.jsx`**: Dropdown navigation menus

#### **Admin Features (`admin-*/`)**
- **`admin-maps/`**: Map-based admin interfaces
- **`admin-otaa/`**: OTA firmware management UI
- **`admin-overviews/`**: System overview dashboards
- **`admin-users/`**: User management interfaces

#### **Core Features**
- **`alarm/`**: Alarm configuration dan monitoring components
- **`dashboard/`**: Dashboard builder dan widget management
- **`datastream/`**: Sensor configuration interfaces
- **`device/`**: Device management dan control panels

### Base UI Components (`ui/` subfolder)

**Fungsi:** shadcn/ui base components yang di-customize untuk aplikasi

#### **Layout Components**
- **`card.jsx`**: Container cards dengan shadows
- **`sheet.jsx`**: Slide-out panels
- **`dialog.jsx`**: Modal dialogs
- **`drawer.jsx`**: Mobile-friendly drawers
- **`sidebar.jsx`**: Sidebar navigation component

#### **Form Components**
- **`input.jsx`**: Text input dengan variants
- **`select.jsx`**: Dropdown select components
- **`checkbox.jsx`**: Checkbox dengan custom styling
- **`radio-group.jsx`**: Radio button groups
- **`switch.jsx`**: Toggle switches
- **`textarea.jsx`**: Multi-line text input
- **`form.jsx`**: Form wrapper dengan validation

#### **Navigation Components**
- **`navigation-menu.jsx`**: Horizontal navigation menus
- **`breadcrumb.jsx`**: Breadcrumb navigation
- **`tabs.jsx`**: Tab navigation
- **`pagination.jsx`**: Table pagination controls

#### **Data Display Components**
- **`table.jsx`**: Base table component
- **`chart.jsx`**: Chart wrapper untuk recharts
- **`badge.jsx`**: Status badges
- **`avatar.jsx`**: User avatar components
- **`progress.jsx`**: Progress bars dan indicators

#### **Feedback Components**
- **`alert.jsx`**: Alert messages
- **`alert-dialog.jsx`**: Confirmation alerts
- **`sonner.jsx`**: Toast notifications
- **`skeleton.jsx`**: Loading skeletons

#### **Utility Components**
- **`button.jsx`**: Base button component
- **`tooltip.jsx`**: Hover tooltips
- **`popover.jsx`**: Popup content
- **`hover-card.jsx`**: Hover preview cards
- **`scroll-area.jsx`**: Custom scrollbars
- **`separator.jsx`**: Visual separators

#### **Animation Components**
- **`glowing-effect.jsx`**: Glowing animation effects
- **`text-shimmer.jsx`**: Shimmer text animations
- **`sliding-number.jsx`**: Animated number transitions
- **`transition-panel.jsx`**: Panel transition animations
- **`morphing-popover.jsx`**: Morphing popup animations

## 🎣 Custom Hooks (`hooks/` folder)

**Fungsi:** Custom React hooks untuk state management dan side effects

#### **Authentication Hooks**
- **`use-auth.js`**: User authentication state dan methods
- **`use-admin-auth.js`**: Admin-specific authentication logic

#### **Device Management Hooks**
- **`use-device-control.js`**: Device command sending dan status
- **`use-device-status.js`**: Real-time device status monitoring

#### **Data Management Hooks**
- **`use-widget-data.js`**: Widget data fetching dan caching
- **`use-whatsapp-status.js`**: WhatsApp service status monitoring

#### **UI Hooks**
- **`use-mobile.js`**: Mobile device detection dan responsive logic
- **`useClickOutside.jsx`**: Click outside detection untuk modals

## 🔧 Libraries (`lib/` folder)

**Fungsi:** Utility functions dan helper libraries

#### **Dashboard Utilities (`dashboard-utils.js`)**
**Fungsi:** Helper functions untuk dashboard management
- Widget positioning calculations
- Layout serialization/deserialization
- Grid system utilities
- Responsive breakpoint handling

#### **Export Utilities (`export-utils.js`)**
**Fungsi:** Data export functionality
- CSV export dengan custom formatting
- PDF generation dengan chart embedding
- Excel export untuk complex data
- Image export untuk charts

#### **Helper Functions (`helper.js`)**
**Fungsi:** General purpose helper functions
- Date/time formatting
- Number formatting dengan localization
- String manipulation utilities
- Data validation helpers

#### **Onboarding Utilities (`onboarding-utils.js`)**
**Fungsi:** User onboarding flow management
- Step-by-step tutorial logic
- Progress tracking
- Feature introduction flows
- Help tooltips management

#### **PDF Components (`pdf-components.jsx`)**
**Fungsi:** React-PDF components untuk export
- PDF layout templates
- Chart rendering untuk PDF
- Table formatting dalam PDF
- Header/footer components

#### **Timezone Utilities (`timezone.js`)**
**Fungsi:** Timezone handling dan conversion
- User timezone detection
- Date conversion utilities
- Timezone-aware data display
- Calendar localization

#### **Utils (`utils.js`)**
**Fungsi:** Core utility functions
- Class name merging (clsx)
- API request helpers
- Error handling utilities
- Local storage management

## 🌐 Context Providers (`providers/` folder)

**Fungsi:** React Context providers untuk global state management

#### **Core Providers**
- **`user-provider.jsx`**: User authentication dan profile state
- **`loading-provider.jsx`**: Global loading state management
- **`theme-provider.jsx`**: Dark/light theme switching
- **`sidebar-provider.jsx`**: Sidebar open/close state

#### **Data Providers**
- **`dashboard-provider.jsx`**: Dashboard state dan widget management
- **`react-query-provider.jsx`**: React Query configuration
- **`websocket-provider.jsx`**: WebSocket connection management

## 🔄 Data Flow Architecture

### 1. **Component Hierarchy**
```
App Router → Layout → Provider → Feature Component → Custom Component → UI Component
```

### 2. **State Management Flow**
```
User Action → Custom Hook → API Call → React Query → Provider Update → Component Re-render
```

### 3. **Real-time Data Flow**
```
WebSocket Provider → Custom Hook → Component Update → UI Re-render
```

### 4. **Form Submission Flow**
```
Form Component → Validation → Custom Hook → API Call → Success/Error Handling
```

## 🏗️ Architecture Patterns

### **Container-Presentation Pattern**
- **Container Components**: Handle data fetching dan business logic
- **Presentation Components**: Pure UI components dengan props
- **Custom Hooks**: Extract state logic dari components

### **Compound Component Pattern**
- Complex components broken down into smaller parts
- Example: Table dengan Header, Body, Row, Cell components
- Better reusability dan composition

### **Provider Pattern**
- Global state management dengan React Context
- Avoid prop drilling
- Centralized state updates

### **Hook Pattern**
- Business logic extraction ke custom hooks
- Reusable state logic across components
- Separation of concerns

## 🎨 Styling Architecture

### **Tailwind CSS Conventions**
- Utility-first approach dengan custom design system
- Consistent spacing, colors, dan typography
- Responsive design dengan mobile-first approach
- Dark mode support dengan CSS variables

### **Component Styling Patterns**
```jsx
// Compound variants untuk button styles
const buttonVariants = cva("base-styles", {
  variants: {
    variant: { primary: "...", secondary: "..." },
    size: { sm: "...", md: "...", lg: "..." }
  }
})
```

### **Animation Strategy**
- Framer Motion untuk complex animations
- CSS transitions untuk simple hover effects
- Loading states dengan skeleton components
- Smooth page transitions

## 📱 Responsive Design Strategy

### **Breakpoint System**
```javascript
// Custom hooks untuk responsive logic
const isMobile = use-mobile()
const isTablet = useMediaQuery('(max-width: 1024px)')
const isDesktop = useMediaQuery('(min-width: 1025px)')
```

### **Mobile-First Components**
- Touch-friendly interface elements
- Swipe gestures untuk mobile navigation
- Responsive grid layouts
- Optimized loading untuk mobile networks

---

**Source Code Frontend MiSREd IoT - Arsitektur modern untuk aplikasi web yang responsive, scalable, dan user-friendly**
