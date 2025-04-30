import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { TasksDialogs } from './components/tasks-dialogs'
import { TasksPrimaryButtons } from './components/tasks-primary-buttons'
import TasksProvider from './context/tasks-context'
import { tasks } from './data/tasks'
import { TopNav } from '@/components/layout/top-nav'

export default function Tasks() {
  return (
    <TasksProvider>
      <Header fixed>
        <TopNav pages={'Devices'} styles={'text-2xl font-bold tracking-tight'} />
        {/* <Search /> */}
        <div className='ml-auto flex items-center space-x-4'>
          <ProfileDropdown />
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            {/* <h2 className='text-2xl font-bold tracking-tight'>Daftar Perangkat IoT</h2> */}
            <p className='text-muted-foreground'>
              Daftar perangkat IoT yang terhubung ke sistem.
            </p>
          </div>
          <TasksPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <DataTable data={tasks} columns={columns} />
        </div>
      </Main>

      <TasksDialogs />
    </TasksProvider>
  )
}
