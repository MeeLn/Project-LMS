'use client'

import { useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import * as faceapi from 'face-api.js'
import axios from 'axios'
import { useRouter } from 'next/navigation'

interface AttendanceResponse {
  success?: string
  error?: string
  debug_info?: any
}

const FaceVerificationPage = () => {
  const [message, setMessage] = useState('')
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [blink, setBlink] = useState(false)
  const [blinkDone, setBlinkDone] = useState(false) // track if blink done
  const [isFaceMatched, setIsFaceMatched] = useState(false)

  const webcamRef = useRef<Webcam | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const router = useRouter()

  const [attendanceKey, setAttendanceKey] = useState('')
  const [courseId, setCourseId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [profilePicture, setProfilePicture] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Blink only once on first mismatch
  useEffect(() => {
    if (message === 'Face does not match profile picture' && !blinkDone) {
      let blinkCount = 0
      const maxBlinks = 6
      const blinkInterval = setInterval(() => {
        setBlink(prev => !prev)
        blinkCount++
        if (blinkCount >= maxBlinks) {
          clearInterval(blinkInterval)
          setBlink(false)
          setBlinkDone(true) // mark blink as done
        }
      }, 100)
      return () => clearInterval(blinkInterval)
    } else if (message !== 'Face does not match profile picture') {
      setBlink(false)
      setBlinkDone(false) // reset when message changes
    }
  }, [message, blinkDone])

  useEffect(() => {
    const loadData = async () => {
      const key = localStorage.getItem('attendance_key')
      const course = localStorage.getItem('course_id')
      const student = localStorage.getItem('student_id')
      const picture = localStorage.getItem('profile_picture')

      if (!key || !course || !student || !picture) {
        setMessage('Missing required data from localStorage.')
        return
      }

      setAttendanceKey(key)
      setCourseId(course)
      setStudentId(student)
      setProfilePicture(picture)
      setIsCameraOpen(true)
      setMessage('Camera ready. Please look at the camera.')

      await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
    }

    loadData()
  }, [])

  useEffect(() => {
    if (!isCameraOpen) return

    let intervalId: number

    const runDetectionAndSubmit = async () => {
      if (
        !webcamRef.current ||
        !canvasRef.current ||
        !webcamRef.current.video ||
        webcamRef.current.video.readyState !== 4 ||
        isSubmitting
      ) {
        return
      }

      const video = webcamRef.current.video
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const displaySize = { width: video.videoWidth, height: video.videoHeight }
      faceapi.matchDimensions(canvas, displaySize)

      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions()
      )

      const resizedDetections = faceapi.resizeResults(detections, displaySize)

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      faceapi.draw.drawDetections(canvas, resizedDetections)

      if (resizedDetections.length === 1) {
        setIsSubmitting(true)

        const imageSrc = webcamRef.current.getScreenshot()
        if (!imageSrc) {
          setMessage('Failed to capture image')
          setIsSubmitting(false)
          return
        }

        try {
          const response = await axios.post<AttendanceResponse>(
            'http://127.0.0.1:8000/api/take-attendance/',
            {
              attendance_key: attendanceKey,
              course_id: courseId,
              student_id: studentId,
              image_data: imageSrc,
              reference_image: profilePicture,
            }
          )

          if (response.data.success) {
            setMessage('Face matched: Attendance successful')
            setIsFaceMatched(true)

            setTimeout(() => {
              router.push('/student/')
            }, 1500)
          } else {
            setMessage(response.data.error || 'Face does not match profile picture')
            setIsSubmitting(false)
          }
        } catch (error: any) {
          if (error.response && error.response.data && typeof error.response.data.error === 'string') {
            setMessage(error.response.data.error)
          } else {
            setMessage('Server error')
          }
          setIsSubmitting(false)
        }
      }
    }

    intervalId = window.setInterval(runDetectionAndSubmit, 1000)

    return () => {
      clearInterval(intervalId)
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }, [isCameraOpen, attendanceKey, courseId, studentId, profilePicture, isSubmitting, router])

  const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: 'user',
  }

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-center">Face Verification</h2>

      {isCameraOpen && (
        <div className="relative w-[320px] h-[240px] mx-auto">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            width={320}
            height={240}
            className="rounded"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0"
            width={320}
            height={240}
            style={{ pointerEvents: 'none' }}
          />
        </div>
      )}

      {message && (
        <div className="text-center mt-4">
          <p
            className={`text-sm font-medium transition-colors duration-100 ${
              message.includes('Face matched')
                ? 'text-green-600'
                : message === 'Face does not match profile picture'
                ? blink
                  ? 'text-red-600' // blinking red
                  : 'text-red-600' // stable red after blinking done
                : 'text-gray-700'
            }`}
          >
            {message}
          </p>

          {message === 'Face does not match profile picture' && (
            <button
              onClick={() => router.push('/student')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
            >
              Cancel Attendance
            </button>
          )}
          {message === 'Attendance already marked for today' && (
            <button
              onClick={() => router.push('/student')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
            >
              Cancel Attendance
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default FaceVerificationPage
