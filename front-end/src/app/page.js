import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboards') // redirect saat halaman diakses
}