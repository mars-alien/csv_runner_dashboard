import './globals.css'

export const metadata = {
  title: 'CSV Runner Dashboard',
  description: 'Track and visualize running data',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}