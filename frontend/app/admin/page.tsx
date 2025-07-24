'use client'

import { useState, useEffect } from 'react'


interface Student {
  id: number
  rollNo: string
  firstName: string
  lastName: string
  email: string
}

interface Teacher {
  id: number
  firstName: string
  lastName: string
  email: string
}

interface CourseForm {
  name: string
  description: string
  attendance_key: string
}

interface VoteForm {
  title: string
  option1: string
  option2: string
  option3: string
  option4: string
}

export default function AdminHomePage() {
  const [activeTab, setActiveTab] = useState<string>('home')
  const [courseForm, setCourseForm] = useState<CourseForm>({
    name: '',
    description: '',
    attendance_key: '',
  })
  const [voteForm, setVoteForm] = useState<VoteForm>({
    title: '',
    option1: '',
    option2: '',
    option3: '',
    option4: ''
  })
  const [noticeContent, setNoticeContent] = useState<string>('')
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])

  const fetchAccounts = async () => {
    try {
      const [studentRes, teacherRes] = await Promise.all([
        fetch('http://localhost:8000/api/students/'),
        fetch('http://localhost:8000/api/teachers/')
      ])
      const studentData = await studentRes.json()
      const teacherData = await teacherRes.json()
      setStudents(studentData)
      setTeachers(teacherData)
    } catch (error) {
      console.error("Failed to load accounts:", error)
    }
  }

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    await fetch(`http://localhost:8000/api/delete-student/${id}/`, { method: 'DELETE' })
    fetchAccounts()
  }

  const handleDeleteTeacher = async (id: number) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return
    await fetch(`http://localhost:8000/api/delete-teacher/${id}/`, { method: 'DELETE' })
    fetchAccounts()
  }

  useEffect(() => {
    if (activeTab === 'manageAccounts') {
      fetchAccounts()
    }
  }, [activeTab])

  const handleAddVote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/api/add-vote/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteForm)
      })

      if (response.ok) {
        alert('Vote added successfully')
        setVoteForm({ title: '', option1: '', option2: '', option3: '', option4: '' })
      } else {
        alert('Failed to add vote')
      }
    } catch (error) {
      console.error("Error adding vote:", error)
      alert('Error occurred while adding vote')
    }
  }

  const handlePostNotice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/api/add-notice/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noticeContent })
      })

      if (response.ok) {
        alert('Notice posted successfully')
        setNoticeContent('')
      } else {
        alert('Failed to post notice')
      }
    } catch (error) {
      console.error("Error posting notice:", error)
      alert('Error occurred while posting notice')
    }
  }

  const inputStyle = 'w-full p-3 border border-gray-600 bg-gray-800 text-white rounded'
  const buttonStyle = 'bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded'

  const renderContent = () => {
    switch (activeTab) {
      case 'addCourse':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">Add Course</h2>
            <form
              className="space-y-4"
              onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault()
                try {
                  const res = await fetch('http://localhost:8000/api/add-course/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(courseForm),
                  })

                  const data = await res.json()
                  if (res.ok) {
                    alert('Course added successfully!')
                    setCourseForm({ name: '', description: '', attendance_key: '' })
                  } else {
                    alert('Error: ' + JSON.stringify(data))
                  }
                } catch (error) {
                  alert('Failed to submit course')
                  console.error(error)
                }
              }}
            >
              <input
                type="text"
                name="name"
                placeholder="Course Name"
                className={inputStyle}
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                required
              />
              <textarea
                name="description"
                placeholder="Course Description"
                className={inputStyle}
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                required
              />
              <input
                type="text"
                name="attendance_key"
                placeholder="Attendance Key"
                className={inputStyle}
                value={courseForm.attendance_key}
                onChange={(e) => setCourseForm({ ...courseForm, attendance_key: e.target.value })}
                required
              />
              <button type="submit" className={buttonStyle}>Add Course</button>
            </form>
          </div>
        )

      case 'manageAccounts':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">Manage Accounts</h2>

            <section className="mb-10">
              <h3 className="text-xl font-semibold mb-2 text-blue-400">Students</h3>
              <table className="w-full bg-gray-800 text-sm text-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-700">
                      <td className="p-3">{student.firstName} {student.lastName}</td>
                      <td className="p-3">{student.email}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2 text-blue-400">Teachers</h3>
              <table className="w-full bg-gray-800 text-sm text-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="border-b border-gray-700">
                      <td className="p-3">{teacher.firstName} {teacher.lastName}</td>
                      <td className="p-3">{teacher.email}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )

      case 'addVote':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">Add Vote</h2>
            <form onSubmit={handleAddVote} className="space-y-4">
              <input type="text" placeholder="Vote Title" className={inputStyle}
                value={voteForm.title}
                onChange={(e) => setVoteForm({ ...voteForm, title: e.target.value })} />
              <input type="text" placeholder="Option 1" className={inputStyle}
                value={voteForm.option1}
                onChange={(e) => setVoteForm({ ...voteForm, option1: e.target.value })} />
              <input type="text" placeholder="Option 2" className={inputStyle}
                value={voteForm.option2}
                onChange={(e) => setVoteForm({ ...voteForm, option2: e.target.value })} />
              <input type="text" placeholder="Option 3" className={inputStyle}
                value={voteForm.option3}
                onChange={(e) => setVoteForm({ ...voteForm, option3: e.target.value })} />
              <input type="text" placeholder="Option 4" className={inputStyle}
                value={voteForm.option4}
                onChange={(e) => setVoteForm({ ...voteForm, option4: e.target.value })} />
              <button type="submit" className={buttonStyle}>Add Vote</button>
            </form>
          </div>
        )

      case 'addNotice':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">Post Notice</h2>
            <form onSubmit={handlePostNotice} className="space-y-4">
              <textarea
                placeholder="Notice content"
                className={inputStyle}
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
              />
              <button type="submit" className={buttonStyle}>Post Notice</button>
            </form>
          </div>
        )

      default:
        return <p className="text-gray-300">Welcome Admin! Choose an option from the sidebar.</p>
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-900 text-white">
      <aside className="w-64 bg-gray-800 p-6 space-y-4">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
        <button onClick={() => setActiveTab('addCourse')} className="block w-full text-left hover:text-blue-400">➕ Add Course</button>
        <button onClick={() => setActiveTab('manageAccounts')} className="block w-full text-left hover:text-blue-400">👥 Manage Accounts</button>
        <button onClick={() => setActiveTab('addVote')} className="block w-full text-left hover:text-blue-400">🗳️ Add Vote</button>
        <button onClick={() => setActiveTab('addNotice')} className="block w-full text-left hover:text-blue-400">📢 Add Notice</button>
        <button
          onClick={() => {
            localStorage.clear()
            window.location.href = '/'
          }}
          className="block w-full text-left hover:text-red-500 mt-4"
        >
          🚪 Logout
        </button>
      </aside>

      <main className="flex-1 p-10">
        {renderContent()}
      </main>
    </div>
  )
}