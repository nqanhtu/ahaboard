import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getBoardData, getUsers, getBoards, getHistory } from "@/actions/kanban"
import KanbanBoard from "@/components/KanbanBoard"
import ProjectSidebar from "@/components/kanban/ProjectSidebar"
import Navbar from "@/components/Navbar"
import ActivityHistoryView from "@/components/kanban/ActivityHistoryView"

export const metadata = {
  title: 'Aha Kanban',
}

export default async function Home({ searchParams }) {
  const session = await auth()
  const params = await searchParams
  
  if (!session) {
    redirect('/login')
  }

  const boardId = params?.boardId
  const view = params?.view || 'board'
  
  const board = await getBoardData(boardId)
  const boards = await getBoards()
  const users = await getUsers()
  
  let historyLogs = []
  if (view === 'history') {
    historyLogs = await getHistory()
  }

  // Serialize data
  const serializedBoard = board ? JSON.parse(JSON.stringify(board)) : null
  const serializedBoards = JSON.parse(JSON.stringify(boards))
  const serializedUsers = JSON.parse(JSON.stringify(users))
  const serializedHistory = JSON.parse(JSON.stringify(historyLogs))

  const currentUser = serializedUsers.find(u => u.id === session.user.id) || session.user

  if (!serializedBoard && serializedBoards.length === 0) {
    return (
      <div style={{ padding: '20px', color: '#172B4D' }}>
        Không tìm thấy bảng công việc. Vui lòng chạy script khởi tạo.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <Navbar 
        session={session}
        currentUser={currentUser}
        boards={serializedBoards} 
        activeBoard={serializedBoard} 
      />

      <div className="flex flex-1 overflow-hidden">
        {serializedBoard && (
          <ProjectSidebar 
            activeBoard={serializedBoard} 
            currentView={view} 
          />
        )}
        
        <main className="flex-1 overflow-hidden relative">
          {view === 'history' ? (
            <ActivityHistoryView historyLogs={serializedHistory} />
          ) : (
            serializedBoard && (
              <KanbanBoard 
                key={serializedBoard.id} 
                initialBoard={serializedBoard} 
                users={serializedUsers} 
                currentUser={currentUser}
              />
            )
          )}
        </main>
      </div>
    </div>
  )
}
