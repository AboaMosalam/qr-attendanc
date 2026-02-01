require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Serve static files correctly in all environments
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
let db;
let studentsCollection;
let instructorsCollection;
let sessionsCollection;
let attendanceCollection;

// Connect to MongoDB
async function connectDB() {
    try {
        if (!MONGODB_URI) {
            console.log('⚠️  WARNING: MONGODB_URI not set. Using in-memory storage (data will be lost on restart)');
            // Fallback to in-memory arrays if MongoDB is not configured
            global.students = [];
            global.instructors = [];
            global.sessions = [];
            global.attendance = [];
            return;
        }

        const client = await MongoClient.connect(MONGODB_URI);
        db = client.db('qr-attendance');

        studentsCollection = db.collection('students');
        instructorsCollection = db.collection('instructors');
        sessionsCollection = db.collection('sessions');
        attendanceCollection = db.collection('attendance');

        // Create indexes for better performance
        await studentsCollection.createIndex({ studentId: 1 }, { unique: true });
        await instructorsCollection.createIndex({ username: 1 }, { unique: true });
        await sessionsCollection.createIndex({ qrCode: 1 }, { unique: true });
        await attendanceCollection.createIndex({ sessionId: 1, studentId: 1 }, { unique: true });

        console.log('✅ Connected to MongoDB successfully!');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.log('⚠️  Falling back to in-memory storage');
        // Fallback to in-memory arrays
        global.students = [];
        global.instructors = [];
        global.sessions = [];
        global.attendance = [];
    }
}

// Helper functions for data access
const getStudents = async () => studentsCollection ? await studentsCollection.find().toArray() : global.students || [];
const getInstructors = async () => instructorsCollection ? await instructorsCollection.find().toArray() : global.instructors || [];
const getSessions = async () => sessionsCollection ? await sessionsCollection.find().toArray() : global.sessions || [];
const getAttendance = async () => attendanceCollection ? await attendanceCollection.find().toArray() : global.attendance || [];

// ============ STUDENT ROUTES ============

// Register a new student
app.post('/api/students/register', async (req, res) => {
    try {
        const { name, studentId, email, phone, department, year } = req.body;

        // Check if student already exists
        const existingStudent = studentsCollection
            ? await studentsCollection.findOne({ studentId })
            : (global.students || []).find(s => s.studentId === studentId);

        if (existingStudent) {
            return res.status(400).json({ error: 'الطالب مسجل بالفعل' });
        }

        const newStudent = {
            id: uuidv4(),
            name,
            studentId,
            email,
            phone,
            department,
            year,
            registeredAt: new Date().toISOString()
        };

        if (studentsCollection) {
            await studentsCollection.insertOne(newStudent);
        } else {
            if (!global.students) global.students = [];
            global.students.push(newStudent);
        }

        res.json({ message: 'تم التسجيل بنجاح', student: newStudent });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء التسجيل' });
    }
});

// Get student by ID
app.get('/api/students/:studentId', async (req, res) => {
    try {
        const student = studentsCollection
            ? await studentsCollection.findOne({ studentId: req.params.studentId })
            : (global.students || []).find(s => s.studentId === req.params.studentId);

        if (!student) {
            return res.status(404).json({ error: 'الطالب غير موجود' });
        }

        res.json(student);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

// ============ INSTRUCTOR ROUTES ============

// Register/Login instructor
app.post('/api/instructors/login', async (req, res) => {
    try {
        const { username, password, name, email } = req.body;

        let instructor = instructorsCollection
            ? await instructorsCollection.findOne({ username })
            : (global.instructors || []).find(i => i.username === username);

        if (!instructor) {
            // Create new instructor
            instructor = {
                id: uuidv4(),
                username,
                password, // In production, hash this!
                name,
                email,
                createdAt: new Date().toISOString()
            };

            if (instructorsCollection) {
                await instructorsCollection.insertOne(instructor);
            } else {
                if (!global.instructors) global.instructors = [];
                global.instructors.push(instructor);
            }
        } else {
            // Verify password
            if (instructor.password !== password) {
                return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
            }
        }

        res.json({
            message: 'تم تسجيل الدخول بنجاح',
            instructor: { id: instructor.id, name: instructor.name, username: instructor.username }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

// ============ SESSION ROUTES ============

// Create a new attendance session
app.post('/api/sessions/create', async (req, res) => {
    try {
        const { instructorId, courseName, lectureTitle, duration } = req.body;

        const newSession = {
            id: uuidv4(),
            instructorId,
            courseName,
            lectureTitle,
            duration: duration || 60,
            qrCode: uuidv4(),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + (duration || 60) * 60 * 1000).toISOString(),
            active: true
        };

        if (sessionsCollection) {
            await sessionsCollection.insertOne(newSession);
        } else {
            if (!global.sessions) global.sessions = [];
            global.sessions.push(newSession);
        }

        res.json({ message: 'تم إنشاء الجلسة بنجاح', session: newSession });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

// Get session by QR code
app.get('/api/sessions/qr/:qrCode', async (req, res) => {
    try {
        const session = sessionsCollection
            ? await sessionsCollection.findOne({ qrCode: req.params.qrCode })
            : (global.sessions || []).find(s => s.qrCode === req.params.qrCode);

        if (!session) {
            return res.status(404).json({ error: 'الجلسة غير موجودة' });
        }

        if (new Date(session.expiresAt) < new Date()) {
            return res.status(400).json({ error: 'انتهت صلاحية الجلسة' });
        }

        res.json(session);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

// Get instructor sessions
app.get('/api/sessions/instructor/:instructorId', async (req, res) => {
    try {
        const sessions = sessionsCollection
            ? await sessionsCollection.find({ instructorId: req.params.instructorId }).toArray()
            : (global.sessions || []).filter(s => s.instructorId === req.params.instructorId);

        res.json(sessions);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

// ============ ATTENDANCE ROUTES ============

// Mark attendance
app.post('/api/attendance/mark', async (req, res) => {
    try {
        const { sessionId, studentId, qrCode } = req.body;

        // Verify session
        const session = sessionsCollection
            ? await sessionsCollection.findOne({ id: sessionId, qrCode })
            : (global.sessions || []).find(s => s.id === sessionId && s.qrCode === qrCode);

        if (!session) {
            return res.status(404).json({ error: 'الجلسة غير موجودة' });
        }

        if (new Date(session.expiresAt) < new Date()) {
            return res.status(400).json({ error: 'انتهت صلاحية الجلسة' });
        }

        // Verify student
        const student = studentsCollection
            ? await studentsCollection.findOne({ studentId })
            : (global.students || []).find(s => s.studentId === studentId);

        if (!student) {
            return res.status(404).json({ error: 'الطالب غير مسجل' });
        }

        // Check if already marked
        const existingAttendance = attendanceCollection
            ? await attendanceCollection.findOne({ sessionId, studentId })
            : (global.attendance || []).find(a => a.sessionId === sessionId && a.studentId === studentId);

        if (existingAttendance) {
            return res.status(400).json({ error: 'تم تسجيل الحضور بالفعل' });
        }

        // Record attendance
        const newAttendance = {
            id: uuidv4(),
            sessionId,
            studentId,
            studentName: student.name,
            markedAt: new Date().toISOString()
        };

        if (attendanceCollection) {
            await attendanceCollection.insertOne(newAttendance);
        } else {
            if (!global.attendance) global.attendance = [];
            global.attendance.push(newAttendance);
        }

        res.json({ message: 'تم تسجيل الحضور بنجاح', attendance: newAttendance });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

// Get attendance for a session
app.get('/api/attendance/session/:sessionId', async (req, res) => {
    try {
        const attendance = attendanceCollection
            ? await attendanceCollection.find({ sessionId: req.params.sessionId }).toArray()
            : (global.attendance || []).filter(a => a.sessionId === req.params.sessionId);

        res.json(attendance);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

// Get attendance report for instructor
app.get('/api/attendance/instructor/:instructorId', async (req, res) => {
    try {
        const sessions = sessionsCollection
            ? await sessionsCollection.find({ instructorId: req.params.instructorId }).toArray()
            : (global.sessions || []).filter(s => s.instructorId === req.params.instructorId);

        const allAttendance = await getAttendance();

        const report = sessions.map(session => ({
            ...session,
            attendees: allAttendance.filter(a => a.sessionId === session.id)
        }));

        res.json(report);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

// ============ SERVE STATIC PAGES ============

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

app.get('/instructor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'instructor.html'));
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server or export for Vercel
if (require.main === module) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📚 Student Portal: http://localhost:${PORT}/student`);
            console.log(`👨‍🏫 Instructor Portal: http://localhost:${PORT}/instructor`);
        });
    });
} else {
    // For Vercel Serverless
    connectDB();
    module.exports = app;
}
