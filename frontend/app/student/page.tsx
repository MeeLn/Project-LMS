'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const user = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : {}

  const [isHovered, setIsHovered] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [notices, setNotices] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: string }>({})
  const [userVotedMap, setUserVotedMap] = useState<{ [key: number]: boolean }>({})
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('home')
  const [attendanceQuery, setAttendanceQuery] = useState('')
  const [attendanceResult, setAttendanceResult] = useState<any>(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceError, setAttendanceError] = useState('')
  const [lostItems, setLostItems] = useState<any[]>([])
  const [attendanceKey, setAttendanceKey] = useState('')

  useEffect(() => {
    if (!user?.userId) return

    fetch(`http://localhost:8000/api/profile/${user.role}/${user.userId}/`)
        .then(res => res.json())
        .then(setProfile)
        .catch(console.error)

    if (activeTab === 'profile') {
      fetch(`http://localhost:8000/api/profile/${user.role}/${user.userId}/`)
        .then(res => res.json())
        .then(setProfile)
        .catch(console.error)
    }

    if (activeTab === 'dashboard') {
      fetch('http://localhost:8000/api/get-notice/')
        .then(res => res.json())
        .then(setNotices)
        .catch(console.error)

      fetch('http://localhost:8000/api/get-vote/')
        .then(res => res.json())
        .then(setVotes)
        .catch(console.error)
    }

    if (activeTab === 'vote') {
      fetch('http://localhost:8000/api/get-vote/')
        .then(res => res.json())
        .then(setVotes)
        .catch(console.error)

      fetch(`http://localhost:8000/api/get-vote-results/?user_id=${user.userId}`)
        .then(res => res.json())
        .then(data => {
          const map: { [key: number]: boolean } = {}
          data.forEach((vote: any) => (map[vote.vote] = true))
          setUserVotedMap(map)
        })
        .catch(console.error)
    }

    if (activeTab === 'courses') {
      fetch('http://localhost:8000/api/get-course-with-content/')
        .then(res => res.json())
        .then(setCourses)
        .catch(console.error)
    }

    if (activeTab === 'lostandfound') {
      fetch('http://localhost:8000/api/lost-found-items/')
        .then(res => res.json())
        .then(setLostItems)
        .catch(console.error)
    }
  }, [activeTab, user?.userId])


  //Vote submission handler
  const handleVoteSubmit = async (voteId: number) => {
    const selectedOption = selectedOptions[voteId]
    if (!selectedOption) return alert("Please select an option before voting.")

    const res = await fetch("http://localhost:8000/api/submit-vote/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vote: voteId,
        selected_option: selectedOption,
        user_id: user.userId
      })
    })

    if (res.ok) {
      alert("Vote submitted successfully!")
      setUserVotedMap(prev => ({ ...prev, [voteId]: true }))
    } else {
      const data = await res.json()
      alert(data.error || "Failed to submit vote.")
    }
  }

  // Attendance handler
  const handleTakeAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!attendanceKey || !selectedCourseId || !user?.userId || !profile?.profile_picture) {
      alert("All fields are required");
      return;
    }

    const res = await fetch('http://localhost:8000/api/verify-key/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attendance_key: attendanceKey,
        course_id: selectedCourseId,
        student_id: user.userId
      })
    })

    const data = await res.json()
    if (res.ok) {
      //Save all required fields for face-verification
      localStorage.setItem('attendance_key', attendanceKey);
      localStorage.setItem('course_id', selectedCourseId.toString());
      localStorage.setItem('student_id', user.userId.toString());

      // Save full URL string of profile
      localStorage.setItem('profile_picture', `http://127.0.0.1:8000${profile.profile_picture}`);

      //Redirect
      window.location.href = '/face-verification'
    } else {
      alert(data.error || "Invalid key")
    }
  }


  //Attendance Search Handler
  const handleAttendanceSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!attendanceQuery || !selectedCourseId) return alert("Please enter student name or roll number")

    setAttendanceLoading(true)
    setAttendanceError('')
    setAttendanceResult(null)

    try {
      const res = await fetch(`http://localhost:8000/api/attendance/${selectedCourseId}/?query=${encodeURIComponent(attendanceQuery)}`)
      const data = await res.json()

      if (!res.ok) {
        setAttendanceError(data.error || 'Failed to fetch attendance.')
        return
      }

      setAttendanceResult(data)
    } catch (error) {
      setAttendanceError('Something went wrong. Please try again.')
    } finally {
      setAttendanceLoading(false)
    }
  }

  //Content Render
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return profile ? (
          <div className="mt-6 overflow-x-auto">
            <h1 className="text-3xl font-bold mb-4">User Profile</h1>

            {/* Profile picture */}
            {profile && profile?.profile_picture && (
              <div className="flex justify-center mb-4">
                <img
                  src={`http://127.0.0.1:8000${profile?.profile_picture}`}
                  alt="P"
                  className="w-40 h-40 rounded-full object-cover border-2 border-gray-400"
                />
              </div>
            )}

            <table className="mx-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2">Field</th>
                  <th className="border border-gray-300 px-4 py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(profile)
                  .filter(([key]) => key !== 'id' && key !== 'password' && key !== 'profile_picture')
                  .map(([key, value]) => (
                    <tr key={key}>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{key}</td>
                      <td className="border border-gray-300 px-4 py-2">{String(value)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-gray-500">Loading profile...</p>
        )


      case 'dashboard':
        return (
          <div className="mt-6 text-left max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-4 text-center">Notices</h1>
            {notices.length > 0 ? (
              notices.map((notice, index) => (
                <div
                  key={index}
                  className="mb-4 p-4 bg-white shadow rounded border border-gray-200"
                >
                  <p className="text-sm text-gray-500 mb-2">
                    Date: {new Date(notice.created_at).toLocaleString()}
                  </p>
                  <p className="text-lg text-gray-800">{notice.content}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No notices found.</p>
            )}

            <h2 className="text-2xl font-bold mt-10 mb-4 text-center">Voting Results</h2>
            {votes.length === 0 ? (
              <p className="text-center text-gray-500">No active votes available.</p>
            ) : (
              votes.map((vote) => {
                // Calculate total votes for this vote to show percentages
                const totalVotes = vote.results
                  ? vote.results.reduce(
                      (acc: number, curr: { selected_option: string; count: number }) =>
                        acc + curr.count,
                      0
                    )
                  : 0

                return (
                  <div
                    key={vote.id}
                    className="mb-6 p-4 bg-white shadow rounded border border-gray-200"
                  >
                    <p className="font-semibold text-lg mb-2">{vote.title}</p>
                    {[vote.option1, vote.option2, vote.option3, vote.option4]
                      .filter(Boolean)
                      .map((option, idx) => {
                        // Find count for this option
                        const optionResult = vote.results?.find(
                          (r: { selected_option: string }) => r.selected_option === option
                        )
                        const count = optionResult ? optionResult.count : 0
                        const percent = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : '0.0'

                        return (
                          <div key={idx} className="mb-1">
                            <span>{option}: </span>
                            <span>
                              {count} vote{count !== 1 ? 's' : ''} ({percent}%)
                            </span>
                          </div>
                        )
                      })}
                  </div>
                )
              })
            )}
          </div>
        )

      case 'courses':
        return (
          <div className="max-w-5xl mx-auto text-left">
            <h1 className="text-3xl font-bold mb-6 text-center">Courses</h1>

            {courses.length === 0 && <p>No courses found.</p>}

            <ul className="mb-8">
              {courses.map(course => (
                <li
                  key={course.id}
                  className={`p-3 border rounded mb-2 cursor-pointer ${
                    selectedCourseId === course.id ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => {
                    if (selectedCourseId === course.id) {
                      setSelectedCourseId(null)
                    } else {
                      setSelectedCourseId(course.id)
                    }
                  }}
                >
                  <h2 className="font-semibold">{course.name}</h2>
                  <p className="text-gray-600">{course.description}</p>
                </li>
              ))}
            </ul>

            {selectedCourseId !== null && courses.find(c => c.id === selectedCourseId) && (
              <section className="bg-white p-6 rounded shadow space-y-8">
                <h2 className="text-2xl font-bold mb-4">
                  Manage Course Content for {courses.find(c => c.id === selectedCourseId)?.name}
                </h2>

                {/* Uploaded Chapters */}
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-2">Uploaded Chapters</h3>
                  {courses.find(c => c.id === selectedCourseId)?.chapters?.length ? (
                    <ul className="list-disc pl-6 space-y-2">
                      {courses.find(c => c.id === selectedCourseId)?.chapters.map((chapter: any) => (
                        <li key={chapter.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{chapter.title}</p>
                            <a
                              href={`http://localhost:8000${chapter.file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 hover:underline"
                            >
                            Download {chapter.title}
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No chapters uploaded yet.</p>
                  )}
                </div>

                {/* Uploaded Assignments */}
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-2">Uploaded Assignments</h3>
                  {courses.find(c => c.id === selectedCourseId)?.assignments?.length ? (
                    <ul className="list-disc pl-6 space-y-4">
                      {courses.find(c => c.id === selectedCourseId)?.assignments.map((assignment: any) => (
                        <li key={assignment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium">{assignment.title}</p>
                            <p className="text-sm text-gray-600">{assignment.description}</p>
                            <a
                              href={`http://localhost:8000${assignment.file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 hover:underline"
                            >
                              Download {assignment.title}
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No assignments uploaded yet.</p>
                  )}
                </div>

                {/* Student Assignment Submission */}
                <div>
                  <h3 className="text-xl font-semibold mb-2">Submit Assignment</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const fileInput = document.getElementById("assignmentFile") as HTMLInputElement;
                      const assignmentIdInput = document.getElementById("assignmentId") as HTMLSelectElement;
                      if (!fileInput?.files?.length || !assignmentIdInput.value) {
                        alert("Please select assignment and file.");
                        return;
                      }

                      // Also make sure user.userId is defined!
                      if (!user?.userId) {
                        alert("User not logged in.");
                        return;
                      }

                      const formData = new FormData();
                      formData.append("assignment", assignmentIdInput.value);
                      formData.append("student", user.userId); // assuming user.userId is student ID
                      formData.append("file", fileInput.files[0]);

                      const res = await fetch("http://localhost:8000/api/submit-assignment/", {
                        method: "POST",
                        body: formData,
                      });

                      const data = await res.json();
                      if (res.ok) {
                        alert(`${data.success}\nCourse: ${data.course_name}`);
                        fileInput.value = "";
                        assignmentIdInput.value = "";
                      } else {
                        alert(data.error || "Submission failed.");
                      }
                    }}
                    className="space-y-2 max-w-md"
                  >
                    <select id="assignmentId" className="w-full p-2 border rounded">
                      <option value="">Select Assignment</option>
                      {courses.find(c => c.id === selectedCourseId)?.assignments.map((assignment: any) => (
                        <option key={assignment.id} value={assignment.id}>
                          {assignment.title}
                        </option>
                      ))}
                    </select>

                    <input
                      type="file"
                      id="assignmentFile"
                      className="w-full p-2 border rounded"
                      accept=".pdf,.doc,.docx"
                    />

                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                      Submit Assignment
                    </button>
                  </form>
                </div>

                {/* Take Attendance Section */}
                <div>
                  <h3 className="text-xl font-semibold mb-2">Take Attendance</h3>
                  <form
                    onSubmit={handleTakeAttendance}
                    className="space-y-2 max-w-md"
                  >
                    <input
                      type="text"
                      placeholder="Enter attendance key"
                      value={attendanceKey}
                      onChange={e => setAttendanceKey(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Take Attendance
                    </button>
                  </form>
                </div>


                {/* Attendance search */}
                <div>
                  <h3 className="text-xl font-semibold mb-2">Search Student Attendance</h3>
                  <form onSubmit={handleAttendanceSearch} className="space-y-2 max-w-md">
                    <input
                      type="text"
                      placeholder="Enter student name or roll number"
                      value={attendanceQuery}
                      onChange={e => setAttendanceQuery(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                    <button
                      type="submit"
                      disabled={attendanceLoading}
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                      {attendanceLoading ? 'Searching...' : 'Search'}
                    </button>
                  </form>

                  {attendanceError && <p className="text-red-600 mt-2">{attendanceError}</p>}

                  {attendanceResult && attendanceResult.length > 0 ? (
                    <div className="mt-4 p-4 bg-gray-50 border rounded max-w-2xl overflow-x-auto">
                      <h4 className="font-semibold mb-4">Attendance Details</h4>
                      <table className="min-w-full border border-gray-300 text-left">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="px-4 py-2 border">Date</th>
                            <th className="px-4 py-2 border">Status</th>
                            <th className="px-4 py-2 border">Student Name</th>
                            <th className="px-4 py-2 border">Roll No</th>
                            <th className="px-4 py-2 border">Course Name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceResult.map((record: any, index: number) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-2 border">{new Date(record.date).toLocaleDateString()}</td>
                              <td className="px-4 py-2 border capitalize">{record.status}</td>
                              <td className="px-4 py-2 border">
                                {record.student?.firstName} {record.student?.lastName}
                              </td>
                              <td className="px-4 py-2 border">{record.student?.rollNo}</td>
                              <td className="px-4 py-2 border">{record.course_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    attendanceResult && (
                      <p className="mt-2 text-gray-600">No attendance records found for this student in the selected course.</p>
                    )
                  )}
                </div>
              </section>
            )}
          </div>
        )
      case 'lostandfound':
        return (
          <div className="max-w-4xl mx-auto text-left">
            <h1 className="text-3xl font-bold mb-6 text-center">Lost & Found Items</h1>
            {/* List of lost & found items */}
            {lostItems.length === 0 ? (
              <p className="text-gray-500 text-center">No lost & found items uploaded yet.</p>
            ) : (
              <ul className="space-y-6 mb-8">
                {lostItems.map(item => (
                  <li key={item.id} className="border rounded p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white shadow">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={`Lost item: ${item.description}`}
                          className="w-24 h-24 object-cover rounded border"
                        />
                        
                      ) : (
                        <div className="w-24 h-24 bg-gray-200 flex items-center justify-center rounded border text-gray-500">
                          No Photo
                        </div>
                      )}
                      <div>
                        <p><strong>Description:</strong> {item.description}</p>
                        <p><strong>Found Location:</strong> {item.found_location}</p>
                        <p><strong>Retrieving Place:</strong> {item.retrieving_place}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )

      case 'vote':
        return (
          <div>
          <h2 className="text-2xl font-semibold mb-4">Active Votes</h2>
          {votes.length === 0 ? (
            <p>No active votes available.</p>
          ) : (
            votes.map(vote => {
              const hasVoted = userVotedMap[vote.id];

              return (
                <div key={vote.id} className="bg-white rounded p-4 shadow mb-4 text-left">
                  <p className="font-medium mb-2">{vote.title}</p>
                  {[vote.option1, vote.option2, vote.option3, vote.option4].map((opt, idx) =>
                    opt ? (
                      <label key={idx} className="block">
                        <input
                          type="radio"
                          name={`vote-${vote.id}`}
                          value={opt}
                          disabled={hasVoted}
                          checked={selectedOptions[vote.id] === opt}
                          onChange={() =>
                            setSelectedOptions(prev => ({ ...prev, [vote.id]: opt }))
                          }
                        />
                        <span className="ml-2">{opt}</span>
                      </label>
                    ) : null
                  )}
                  <button
                    disabled={hasVoted}
                    onClick={() => handleVoteSubmit(vote.id)}
                    className={`mt-2 px-4 py-1 rounded text-white ${
                      hasVoted ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {hasVoted ? 'Voted' : 'Vote'}
                  </button>
                </div>
              );
            })
          )}
        </div>
        )

      default:
        return (
          <>
            <h1 className="text-4xl font-bold mb-4">Welcome to the LMS Portal</h1>
            <p className="text-lg text-gray-600">Use the navigation bar to explore.</p>
          </>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Navbar */}
      <nav className="bg-white shadow-md py-4 px-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
          <span className="font-bold text-xl">LMS</span>
        </div>

        <div className="flex items-center space-x-6">
          {['home', 'courses', 'vote', 'dashboard', 'lostandfound'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="hover:text-blue-600 font-medium capitalize"
            >
              {tab}
            </button>
          ))}
          <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center cursor-pointer">
              <img
                  src={`http://127.0.0.1:8000${profile?.profile_picture}`}
                  alt="P"
                  className="w-20 h-10 rounded-full object-cover border-1 border-gray-400"
                />
            </div>

            {isHovered && (
              <div className="absolute right-0 top-10 w-40 bg-white shadow-lg rounded-md py-2 z-50">
                <button
                  onClick={() => {
                    setActiveTab('profile')
                    setIsHovered(false)
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    localStorage.removeItem('user')
                    window.location.href = "/"
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="p-8 text-center">{renderContent()}</main>
    </div>
  )
}
