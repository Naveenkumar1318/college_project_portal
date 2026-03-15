import { useEffect,useState } from "react";
import API from "../../services/api";

function TaskBoard({projectId}){

const [tasks,setTasks] = useState([]);

useEffect(()=>{
 loadTasks();
},[]);


const loadTasks = async()=>{

 const res = await API.get(`/projects/${projectId}/tasks`);
 setTasks(res.data);

};

return(

<div className="task-board">

<h3>Project Tasks</h3>

{tasks.map(t=>(
<div key={t.id} className="task-card">

<h4>{t.title}</h4>
<p>{t.description}</p>
<span>{t.status}</span>

</div>
))}

</div>

);

}

export default TaskBoard;