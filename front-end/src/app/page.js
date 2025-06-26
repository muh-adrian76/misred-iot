import { redirect } from 'next/navigation'

export default function Page() {
  redirect('/auth') // redirect saat halaman diakses
}