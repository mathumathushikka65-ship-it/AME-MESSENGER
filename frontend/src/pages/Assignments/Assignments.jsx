
import "./Assignments.css"
import { FaCheck, FaDotCircle, FaPlus } from "react-icons/fa";
import { useState ,useMemo} from "react";

export default function Assignments(){
      const [showForm, setShowForm] = useState(false);
      const [assignments, setAssignments] = useState([]);
      const [dueDate, setDueDate] = useState("");
// const todayString = new Date().toISOString().split("T")[0];



  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const getDeadlineState = (assignment) => {
    if (assignment.status === "Completed") return "completed";
    if (assignment.dueDate < todayString) return "overdue";
    if (assignment.dueDate === todayString) return "today";
    return "upcoming";
  };

        const stats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter(
      (item) => item.status === "completed"
    ).length;
    const overdue = assignments.filter(
      (item) => getDeadlineState(item) === "overdue"
    ).length;
    const upcoming = assignments.filter(
      (item) => getDeadlineState(item) === "upcoming"
    ).length;

    return {
      total,
      completed,
      overdue,
      upcoming,
      progress: total ? Math.round((completed / total) * 100) : 0,
    };
  }, [assignments, todayString]);
   return(
    <div className="Assigner">

    <div>
        <div>
            <span><FaDotCircle/>AME MESSENGER/WORKSPACE</span>
          <h1>Assignment<span> Center</span></h1>  
            <p>Plan your work,track your progress,and stay ahead of every deadline.</p>
        </div>
        <div>
            <button
          type="button"
          className="ame-primary-button"
          onClick={() => setShowForm((value) => !value)}
        >
          <FaPlus/>
          {showForm ? "Close form" : "New assignment"}
        </button>
        </div>
    </div>

 <div className="assign-top-box">   <div>
        <h6>YOUR LEARNING JOURNEY</h6>
     <h2>Small steps.  <span>Big progress.</span></h2>  
        <p>Every completed task takes you one step closer to your goal.</p></div>

               <div className="ame-progress">
            <span>{stats.completed} of {stats.total} completed</span>
            <strong>{stats.progress}%</strong>
          </div>

          <div
            className="ame-progress-track"
            role="progressbar"
            aria-label="assignment completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stats.progress}
          >
            <div
              className="ame-progress-fill"
              style={{ width: `${stats.progress}%` }}
            />
          </div>

          <div><FaCheck/></div>
        

    </div>
     
      <section className="ame-stat-grid">
        <article className="ame-stat-card">
          <div className="ame-stat-top">
            <span className="ame-stat-icon ame-icon-blue"><FaTasks /></span>
            <span className="ame-stat-caption">ALL TASKS</span>
          </div>
          <strong>{stats.total}</strong>
          <p>Total assignments</p>
        </article>

        <article className="ame-stat-card">
          <div className="ame-stat-top">
            <span className="ame-stat-icon ame-icon-purple"><FaClock /></span>
            <span className="ame-stat-caption">IN PROGRESS</span>
          </div>
          <strong>
            {assignments.filter((item) => item.status === "In Progress").length}
          </strong>
          <p>Currently working on</p>
        </article>

        <article className="ame-stat-card">
          <div className="ame-stat-top">
            <span className="ame-stat-icon ame-icon-red"><FaExclamationCircle /></span>
            <span className="ame-stat-caption">NEEDS ATTENTION</span>
          </div>
          <strong>{stats.overdue}</strong>
          <p>Overdue assignments</p>
        </article>

        <article className="ame-stat-card">
          <div className="ame-stat-top">
            <span className="ame-stat-icon ame-icon-green"><FaCheckCircle /></span>
            <span className="ame-stat-caption">FINISHED</span>
          </div>
          <strong>{stats.completed}</strong>
          <p>Completed assignments</p>
        </article>
      </section>
    
    </div>

    
   );
} 