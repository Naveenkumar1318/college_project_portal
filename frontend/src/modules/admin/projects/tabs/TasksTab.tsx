import TaskMessages from "../../../../components/tasks/TaskMessages";

interface Props {
  projectId: number;
}

const TasksTab = ({ projectId }: Props) => {

  return (
    <div>
      <TaskMessages projectId={projectId} />
    </div>
  );

};

export default TasksTab;