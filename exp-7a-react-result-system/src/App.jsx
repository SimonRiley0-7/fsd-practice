import './App.css';

function App() {
  // Dummy data for the student result management system
  const results = [
    { id: 1, name: 'Alice Johnson', rollNo: 'S001', score: 85, max: 100 },
    { id: 2, name: 'Bob Smith', rollNo: 'S002', score: 38, max: 100 },
    { id: 3, name: 'Charlie Davis', rollNo: 'S003', score: 92, max: 100 },
    { id: 4, name: 'Diana Prince', rollNo: 'S004', score: 65, max: 100 }
  ];

  return (
    <div>
      <h1>Student Result Management System</h1>
      
      <div className="results-grid">
        {results.map((student) => {
          const percentage = (student.score / student.max) * 100;
          const passed = percentage >= 40; // 40% passing criteria

          return (
            <div key={student.id} className="student-card">
              <h2>{student.name}</h2>
              <div className="roll-no">Roll No: {student.rollNo}</div>
              
              <div className="score">
                {student.score} / {student.max}
              </div>
              
              <div className={`status ${passed ? 'pass' : 'fail'}`}>
                {passed ? 'PASSED' : 'FAILED'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
