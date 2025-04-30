interface TopNavProps extends React.HTMLAttributes<HTMLElement> {
  styles: string
  pages: string
}

export function TopNav({ styles, pages }: TopNavProps) {
  return (
    <>
      <h1 className={styles}>{pages}</h1>
    </>
  )
}
