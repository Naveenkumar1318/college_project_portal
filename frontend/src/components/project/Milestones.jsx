import { useEffect,useState } from "react";
import API from "../../services/api";

function Milestones({projectId}){

const [milestones,setMilestones] = useState([]);

useEffect(()=>{

 loadMilestones();

},[]);


const loadMilestones = async()=>{

 const res = await API.get(`/projects/${projectId}/milestones`);

 setMilestones(res.data);

};

return(

<div className="timeline">

<h3>Project Timeline</h3>

{milestones.map(m=>(
<div key={m.id} className="timeline-item">

<h4>{m.title}</h4>
<p>{m.description}</p>
<span>{m.deadline}</span>

</div>
))}

</div>

);

}

export default Milestones;