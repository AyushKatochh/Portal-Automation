from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient('mongodb+srv://AyushKatoch:ayush2002@cluster0.72gtk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client['aicte']
admins_collection = db['admins']
applications_collection = db['applications']

# Members list: [name, no_of_tasks, deadline_of_latest_task]
def get_members():
    member=[]
    admins=list(admins_collection.find({"committee": "Scrutiny"}))
    for admin in admins:
        admin_id=admin.get('_id')
        no_of_tasks=len(admin.get('applications', []))
        if admin['applications']:
            latest_deadline = max(app['deadline'] for app in admin['applications'])
        else:
            latest_deadline = datetime.min  # No applications allocated yet
        member.append([admin_id,no_of_tasks,latest_deadline])
    return member
        
members=get_members()

def allocate_task(members):
    # Sort by number of tasks (ascending), then by earliest deadline
    members.sort(key=lambda x: (x[1], x[2]))
    
    # Select the member with the least burden
    selected_member = members[0]
    selected_member[1] += 1  # Increment task count
    selected_member[2] += timedelta(days=2)  # Extend deadline by 2 days

    print(f"Task allocated to: {selected_member[0]} (New Deadline: {selected_member[2]})")
    return members

# Allocate the task
updated_members = allocate_task(members)

# Visualize Task Scheduling
def visualize_schedule(members):
    now = datetime.now()
    fig, ax = plt.subplots(figsize=(12, 6))

    # Plot each member's tasks
    for idx, member in enumerate(members):
        member_id, no_of_tasks, latest_deadline = member
        start_date = now  # Assume tasks start now
        end_date = latest_deadline
        
        # Plot a horizontal bar for the task schedule
        ax.barh(str(member_id), (end_date - start_date).days, left=start_date, color="skyblue")
        ax.text(end_date, idx, f"Tasks: {no_of_tasks}", va="center", ha="left")

    # Set x-axis as dates
    ax.xaxis.set_major_locator(mdates.DayLocator(interval=1))  # Show each day
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m-%d"))  # Format as YYYY-MM-DD
    plt.xticks(rotation=45)  # Rotate dates for readability

    # Customize the plot
    ax.set_xlabel("Date")
    ax.set_ylabel("Members (ObjectIds)")
    ax.set_title("Task Scheduling Visualization (with Dates)")
    ax.grid(True, linestyle="--", alpha=0.5)
    plt.tight_layout()
    plt.show()

# Visualize the updated task schedule
visualize_schedule(updated_members)