import { Outlet, createRootRoute } from '@tanstack/react-router'
import { HeadContent, Scripts } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import appCss from '../styles.css?url'
import { getProjects } from '@/server/projects'
import { ProjectSidebar } from '@/components/project-sidebar'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'BeadWork',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  loader: async () => {
    const projects = await getProjects()
    return { projects }
  },
  component: RootComponent,
})

function RootComponent() {
  const { projects } = Route.useLoaderData()
  
  return (
    <RootDocument>
      <div className="flex h-screen bg-background text-foreground">
        <ProjectSidebar projects={projects} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: `
          if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        ` }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
