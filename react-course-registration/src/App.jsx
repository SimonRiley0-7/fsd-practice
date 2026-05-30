import { useState } from 'react';
import './App.css';

function App() {
  const [courses, setCourses] = useState([
    { id: 1, code: 'CS101', name: 'Introduction to Computer Science', instructor: 'Dr. Smith' },
    { id: 2, code: 'MATH201', name: 'Calculus II', instructor: 'Prof. Johnson' }
  ]);

  const [formData, setFormData] = useState({ id: null, code: '', name: '', instructor: '' });
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.instructor) {
      return alert('Please fill all fields');
    }

    if (isEditing) {
      // Update existing course
      setCourses(courses.map(c => c.id === formData.id ? formData : c));
      setIsEditing(false);
    } else {
      // Add new course
      const newCourse = { ...formData, id: Date.now() };
      setCourses([...courses, newCourse]);
    }
    
    // Reset form
    setFormData({ id: null, code: '', name: '', instructor: '' });
  };

  const editCourse = (course) => {
    setFormData(course);
    setIsEditing(true);
  };

  const deleteCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  return (
    <div className="app-container">
      <h1>Student Course Registration</h1>
      
      <div className="card">
        <h2>{isEditing ? 'Update Course' : 'Add New Course'}</h2>
        <form onSubmit={handleSubmit} className="course-form">
          <input 
            type="text" 
            name="code" 
            placeholder="Course Code (e.g. CS101)" 
            value={formData.code} 
            onChange={handleInputChange} 
          />
          <input 
            type="text" 
            name="name" 
            placeholder="Course Name" 
            value={formData.name} 
            onChange={handleInputChange} 
          />
          <input 
            type="text" 
            name="instructor" 
            placeholder="Instructor Name" 
            value={formData.instructor} 
            onChange={handleInputChange} 
          />
          <button type="submit" className={isEditing ? 'btn-update' : 'btn-add'}>
            {isEditing ? 'Update Details' : 'Register Course'}
          </button>
          {isEditing && (
            <button type="button" className="btn-cancel" onClick={() => {
              setIsEditing(false);
              setFormData({ id: null, code: '', name: '', instructor: '' });
            }}>Cancel</button>
          )}
        </form>
      </div>

      <div className="course-list">
        <h2>Registered Courses ({courses.length})</h2>
        {courses.length === 0 ? <p>No courses registered yet.</p> : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th>Instructor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td><strong>{course.code}</strong></td>
                  <td>{course.name}</td>
                  <td>{course.instructor}</td>
                  <td>
                    <button className="btn-edit" onClick={() => editCourse(course)}>Edit</button>
                    <button className="btn-delete" onClick={() => deleteCourse(course.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
