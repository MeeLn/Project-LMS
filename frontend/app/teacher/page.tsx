'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {

  const router = useRouter()

  const user = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : {}

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [notices, setNotices] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: string }>({})
  const [userVotedMap, setUserVotedMap] = useState<{ [key: number]: boolean }>({});
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('home')

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  // State for chapter upload form
  const [chapterTitle, setChapterTitle] = useState('')
  const [chapterFile, setChapterFile] = useState<File | null>(null)

  // State for assignment upload form
  const [assignmentTitle, setAssignmentTitle] = useState('')
  const [assignmentDescription, setAssignmentDescription] = useState('')
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null)

  // State for attendance input and result
  const [attendanceQuery, setAttendanceQuery] = useState('')
  const [attendanceResult, setAttendanceResult] = useState<any>(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceError, setAttendanceError] = useState('')

  // State for lost and found item form
  const [lostItems, setLostItems] = useState<any[]>([])
  const [lostDescription, setLostDescription] = useState('')
  const [lostFoundLocation, setLostFoundLocation] = useState('')
  const [lostRetrievingPlace, setLostRetrievingPlace] = useState('')
  const [lostPhoto, setLostPhoto] = useState<File | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)

  //states for assignment search
const [assignmentQuery, setAssignmentQuery] = useState('')
const [assignmentResults, setAssignmentResults] = useState<any[]>([])
const [assignmentLoading, setAssignmentLoading] = useState(false)
const [assignmentError, setAssignmentError] = useState('')




  useEffect(() => {

    if (!user || !user.userId) {
      router.push('/')
      return
    }

    if (activeTab === 'profile' && user?.role && user?.userId) {
  fetch(`http://localhost:8000/api/profile/${user.role}/${user.userId}/`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => setProfile(data))
    .catch(err => console.error("Failed to fetch profile", err));
}


    if (activeTab === 'dashboard') {
      fetch(`http://localhost:8000/api/get-notice/`)
        .then(res => res.json())
        .then(data => setNotices(data))
        .catch(err => console.error("Failed to fetch notices", err))

      // Fetch active votes
      fetch('http://localhost:8000/api/get-vote/')
        .then(res => res.json())
        .then(data => setVotes(data))
        .catch(err => console.error('Failed to fetch votes', err))
    }

    if (activeTab === 'courses') {
      fetch(`http://localhost:8000/api/get-course-with-content/`)
        .then(res => res.json())
        .then(data => setCourses(data))
        .catch(err => console.error("Failed to fetch courses with content", err))
    }

    if (activeTab === 'lostandfound') {
      fetch('http://localhost:8000/api/lost-found-items/')
        .then(res => res.json())
        .then(data => setLostItems(data))
        .catch(err => console.error('Failed to fetch lost & found items', err))
    }

    if (activeTab === 'vote') {
      // Fetch active votes
      fetch('http://localhost:8000/api/get-vote/')
        .then(res => res.json())
        .then(data => setVotes(data))
        .catch(err => console.error('Failed to fetch votes', err))

      //Fetch submitted votes to check if already voted
      if (user?.userId) {
        fetch(`http://localhost:8000/api/get-vote-results/?user_id=${user.userId}`)
          .then(res => res.json())
          .then(data => {
            const votedMap: { [key: number]: boolean } = {};
            data.forEach((vote: any) => {
              votedMap[vote.vote] = true;
            });
            setUserVotedMap(votedMap);
          })
          .catch(err => console.error("Failed to fetch vote results", err))
      } else {
        console.warn("No userId found in localStorage")
      }
      
    }

  }, [activeTab])

  // Assignment Search Handler
  const handleAssignmentSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setAssignmentError('')
    setAssignmentResults([])

    if (!assignmentQuery.trim() || !selectedCourseId) {
      setAssignmentError('Please enter student name or roll number and select a course.')
      return
    }

    setAssignmentLoading(true)

    try {
      const res = await fetch(
        `http://localhost:8000/api/search-submissions/?query=${encodeURIComponent(assignmentQuery)}&course_id=${encodeURIComponent(selectedCourseId)}`
      )
      const data = await res.json()

      if (!res.ok) {
        setAssignmentError(data.error || 'Failed to fetch assignments.')
        return
      }

      if (Array.isArray(data) && data.length === 0) {
        setAssignmentError('Student found, but no assignment records for the selected course.')
      } else {
        setAssignmentResults(data)
      }
    } catch (error) {
      setAssignmentError('Student not found. Please check name or roll number.')
    } finally {
      setAssignmentLoading(false)
    }
  }

  // Handlers for uploads
  const handleChapterUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chapterTitle || !chapterFile || !selectedCourseId) return alert("Please fill all chapter fields")
    const formData = new FormData()
    formData.append('course_id', selectedCourseId.toString())
    formData.append('title', chapterTitle)
    formData.append('file', chapterFile)

    try {
      const res = await fetch('http://localhost:8000/api/upload-chapter/', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      alert('Chapter uploaded successfully')
      setChapterTitle('')
      setChapterFile(null)
    } catch (error) {
      alert('Chapter upload error: ' + error)
    }
  }

  const handleAssignmentUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignmentTitle || !assignmentDescription || !assignmentFile || !selectedCourseId)
      return alert("Please fill all assignment fields")

    const formData = new FormData()
    formData.append('course_id', selectedCourseId.toString())
    formData.append('title', assignmentTitle)
    formData.append('description', assignmentDescription)
    formData.append('file', assignmentFile)

    try {
      const res = await fetch('http://localhost:8000/api/upload-assignment/', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      alert('Assignment uploaded successfully')
      setAssignmentTitle('')
      setAssignmentDescription('')
      setAssignmentFile(null)
    } catch (error) {
      alert('Assignment upload error: ' + error)
    }
  }

  // Delete Chapter handler
  const deleteChapter = async (chapterId: number) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;

    try {
      const res = await fetch(`http://localhost:8000/api/delete-chapter/${chapterId}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete chapter');

      // Update local state to remove chapter
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.id === selectedCourseId
            ? {
                ...course,
                chapters: course.chapters.filter((ch: any) => ch.id !== chapterId),
              }
            : course
        )
      );
    } catch (error) {
      alert('Error deleting chapter: ' + error);
    }
  };

  // Delete Assignment handler
  const deleteAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const res = await fetch(`http://localhost:8000/api/delete-assignment/${assignmentId}/`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete assignment');

      // Update local state to remove assignment
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.id === selectedCourseId
            ? {
                ...course,
                assignments: course.assignments.filter((a: any) => a.id !== assignmentId),
              }
            : course
        )
      );
    } catch (error) {
      alert('Error deleting assignment: ' + error);
    }
  }

  //Attendance Search Handler
  const handleAttendanceSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttendanceError('')
    setAttendanceResult(null)

    if (!attendanceQuery.trim() || !selectedCourseId) {
      setAttendanceError('Please enter student name or roll number and select a course.')
      return
    }

    setAttendanceLoading(true)

    try {
      const res = await fetch(
        `http://localhost:8000/api/attendance/${selectedCourseId}/?query=${encodeURIComponent(attendanceQuery)}`
      )
      const data = await res.json()

      if (!res.ok) {
        setAttendanceError(data.error || 'Failed to fetch attendance.')
        return
      }

      if (Array.isArray(data) && data.length === 0) {
        setAttendanceError('Student found, but no attendance records for the selected course.')
      } else {
        setAttendanceResult(data)
      }
    } catch (error) {
      setAttendanceError('Student not found. Please check name or roll number.')
    } finally {
      setAttendanceLoading(false)
    }
  }

  //Lost and Found Handler
  const handleLostItemUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lostDescription || !lostFoundLocation || !lostRetrievingPlace) {
      return alert('Please fill all fields')
    }

    const formData = new FormData()
    formData.append('description', lostDescription)
    formData.append('found_location', lostFoundLocation)
    formData.append('retrieving_place', lostRetrievingPlace)
    if (lostPhoto) {
      formData.append('photo', lostPhoto)
    }

    try {
      const res = await fetch('http://localhost:8000/api/upload-lost-item/', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')

      alert('Lost & Found item uploaded successfully')
      setLostDescription('')
      setLostFoundLocation('')
      setLostRetrievingPlace('')
      setLostPhoto(null)

      // Refresh list
      const updated = await fetch('http://localhost:8000/api/lost-found-items/')
      const updatedData = await updated.json()
      setLostItems(updatedData)
    } catch (error) {
      alert('Upload error: ' + error)
    }
  }

  //Delete Lost and Found Handler
  const deleteLostItem = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/delete-lost-item/${id}/`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete item')

      setLostItems(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      alert('Error deleting lost item: ' + error)
    }
  }

  //Vote Handler
  const handleVoteSubmit = async (voteId: number) => {
    const selectedOption = selectedOptions[voteId];

    if (!selectedOption) {
      alert("Please select an option before voting.");
      return;
    }

    const res = await fetch("http://localhost:8000/api/submit-vote/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vote: voteId,
        selected_option: selectedOption,
        user_id: user.userId
      })
    });

    if (res.ok) {
      alert("Vote submitted successfully!");
      setUserVotedMap(prev => ({ ...prev, [voteId]: true }));
    } else {
      const data = await res.json();
      alert(data.error || "Failed to submit vote.");
    }
  }

  //Content Render
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return profile ? (
          <div className="mt-6 overflow-x-auto">
            <h1 className="text-3xl font-bold mb-2">User Profile</h1>
            <table className="mx-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2">Field</th>
                  <th className="border border-gray-300 px-4 py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(profile)
                  .filter(([key]) => key !== 'id' && key !== 'password')
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteChapter(chapter.id)
                            }}
                            className="ml-4 px-2 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-600 hover:text-white"
                            title="Delete Chapter"
                          >
                            Delete
                          </button>
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteAssignment(assignment.id)
                            }}
                            className="mt-2 sm:mt-0 px-2 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-600 hover:text-white"
                            title="Delete Assignment"
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No assignments uploaded yet.</p>
                  )}
                </div>

                {/* Chapter upload form */}
                <form onSubmit={handleChapterUpload} className="space-y-4">
                  <h3 className="text-xl font-semibold">Upload Chapter</h3>
                  <input
                    type="text"
                    placeholder="Chapter Title"
                    value={chapterTitle}
                    onChange={e => setChapterTitle(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <div>
                    <input
                      type="file"
                      accept="application/pdf"
                      id="chapterFileInput"
                      onChange={e => setChapterFile(e.target.files ? e.target.files[0] : null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="chapterFileInput"
                      className="inline-flex items-center cursor-pointer text-2xl p-2 border rounded hover:bg-gray-200"
                      title={chapterFile ? chapterFile.name : "Upload Chapter PDF"}
                    >
                      📂
                    </label>
                    {chapterFile && (
                      <span className="ml-2 text-sm text-gray-600">{chapterFile.name}</span>
                    )}
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Upload Chapter
                  </button>
                </form>

                {/* Assignment upload form */}
                <form onSubmit={handleAssignmentUpload} className="space-y-4">
                  <h3 className="text-xl font-semibold">Upload Assignment</h3>
                  <input
                    type="text"
                    placeholder="Assignment Title"
                    value={assignmentTitle}
                    onChange={e => setAssignmentTitle(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <textarea
                    placeholder="Assignment Description"
                    value={assignmentDescription}
                    onChange={e => setAssignmentDescription(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={3}
                  />
                  <div>
                    <input
                      type="file"
                      accept="application/pdf"
                      id="assignmentFileInput"
                      onChange={e => setAssignmentFile(e.target.files ? e.target.files[0] : null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="assignmentFileInput"
                      className="inline-flex items-center cursor-pointer text-2xl p-2 border rounded hover:bg-gray-200"
                      title={assignmentFile ? assignmentFile.name : "Upload Assignment PDF"}
                    >
                      📂
                    </label>
                    {assignmentFile && (
                      <span className="ml-2 text-sm text-gray-600">{assignmentFile.name}</span>
                    )}
                  </div>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Upload Assignment
                  </button>
                </form>

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
                      <p className="mt-2 text-gray-600"></p>
                    )
                  )}
                </div>

                {/* Assignment search */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-2">Search Student Assignments</h3>
                  <form onSubmit={handleAssignmentSearch} className="space-y-2 max-w-md">
                    <input
                      type="text"
                      placeholder="Enter student name or roll number"
                      value={assignmentQuery}
                      onChange={e => setAssignmentQuery(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                    <button
                      type="submit"
                      disabled={assignmentLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      {assignmentLoading ? 'Searching...' : 'Search'}
                    </button>
                  </form>

                  {assignmentError && <p className="text-red-600 mt-2">{assignmentError}</p>}

                  {assignmentResults && assignmentResults.length > 0 ? (
                    <div className="mt-4 p-4 bg-gray-50 border rounded max-w-4xl overflow-x-auto">
                      <h4 className="font-semibold mb-4">Assignment Submissions</h4>
                      <table className="min-w-full border border-gray-300 text-left">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="px-4 py-2 border">Roll No</th>
                            <th className="px-4 py-2 border">Student Name</th>
                            <th className="px-4 py-2 border">Course Name</th>
                            <th className="px-4 py-2 border">Assignment Title</th>
                            <th className="px-4 py-2 border">Submitted At</th>
                            <th className="px-4 py-2 border">File</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* course selector issue */}
                          {assignmentResults.filter(record => record.course_id = selectedCourseId).map((record, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-2 border">{record.roll_no}</td>
                              <td className="px-4 py-2 border">{record.student_name}</td>
                              <td className="px-4 py-2 border">{record.course_name}</td>
                              <td className="px-4 py-2 border">{record.assignment_title}</td>
                              <td className="px-4 py-2 border">{new Date(record.submitted_at).toLocaleString()}</td>
                              <td className="px-4 py-2 border">
                                <a
                                  href={`http://localhost:8000${record.file_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline"
                                >
                                  View File
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    assignmentResults && (
                      <p className="mt-2 text-gray-600"></p>
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

            {/* toggler*/}
            <div className="text-center mb-6">
              <button
                onClick={() => setShowUploadForm(prev => !prev)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {showUploadForm ? 'Close' : '➕ New Item'}
              </button>
            </div>

            {/*show upload form if button clicked*/}
            {showUploadForm && (
              <form onSubmit={handleLostItemUpload} className="space-y-4 bg-white p-6 rounded shadow max-w-md mx-auto mb-10">
                <h3 className="text-xl font-semibold mb-4">Upload Lost & Found Item</h3>

                <textarea
                  placeholder="Description"
                  value={lostDescription}
                  onChange={e => setLostDescription(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                  required
                />

                <input
                  type="text"
                  placeholder="Found Location"
                  value={lostFoundLocation}
                  onChange={e => setLostFoundLocation(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />

                <input
                  type="text"
                  placeholder="Retrieving Place"
                  value={lostRetrievingPlace}
                  onChange={e => setLostRetrievingPlace(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    id="lostItemPhotoInput"
                    onChange={e => setLostPhoto(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="lostItemPhotoInput"
                    className="inline-flex items-center cursor-pointer text-2xl p-2 border rounded hover:bg-gray-200"
                    title={lostPhoto ? lostPhoto.name : "Upload Photo"}
                  >
                    📷
                  </label>
                  {lostPhoto && (
                    <span className="ml-2 text-sm text-gray-600">{lostPhoto.name}</span>
                  )}
                </div>

                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                  Upload Item
                </button>
              </form>
            )}

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
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this lost & found item?')) {
                          deleteLostItem(item.id)
                        }
                      }}
                      className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-600 hover:text-white"
                      title="Delete Lost Item"
                    >
                      Delete
                    </button>
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
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800 relative">
      {/* Top Navbar for all devices */}
      <nav className="bg-white shadow-md py-4 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
          <span className="font-bold text-xl">LMS</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center space-x-6">
          {['home', 'courses', 'vote', 'dashboard', 'lostandfound'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="hover:text-blue-600 font-medium capitalize"
            >
              {tab}
            </button>
          ))}

          {/* Profile Icon */}
          <div
            className="relative"
            onMouseEnter={() => setIsProfileHovered(true)}
            onMouseLeave={() => setIsProfileHovered(false)}
          >
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center cursor-pointer">
              <span className="text-sm font-semibold text-white">P</span>
            </div>

            {isProfileHovered && (
              <div className="absolute right-0 top-10 w-40 bg-white shadow-lg rounded-md py-2 z-50">
                <button
                  onClick={() => {
                    setActiveTab('profile')
                    setIsProfileHovered(false)
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-red-600 font-medium hover:text-red-800 hover:bg-gray-100"
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

        {/* Hamburger for mobile */}
        <div className="sm:hidden">
          <button onClick={toggleMobileMenu} className="text-gray-800 focus:outline-none text-2xl">
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar Menu */}
      <div className={`sm:hidden fixed top-0 right-0 h-full w-52 bg-white shadow-lg z-40 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 space-y-4">
          {['home', 'courses', 'vote', 'dashboard', 'lostandfound'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setIsMobileMenuOpen(false)
              }}
              className="block text-left w-full text-gray-800 font-medium hover:text-blue-600 capitalize"
            >
              {tab}
            </button>
          ))}
          <hr className="my-2" />
          <button
            onClick={() => {
              setActiveTab('profile')
              setIsMobileMenuOpen(false)
            }}
            className="block text-left w-full text-gray-800 font-medium hover:text-blue-600"
          >
            Profile
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('user')
              window.location.href = "/"
            }}
            className="block text-left w-full text-red-600 font-medium hover:text-red-800"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 p-4 sm:p-8">
        {renderContent()}
      </main>
    </div>
  )
}
