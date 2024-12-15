from datetime import timedelta, datetime
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client['aicte']
admins_collection = db['admins']


def get_members_scrutiny():
    """
    Retrieve members from the Scrutiny committee
    
    Returns:
        List of members with their task details
    """
    member = []
    admins = list(admins_collection.find({"committee": "Scrutiny"}))
    for admin in admins:
        admin_id = str(admin.get('_id'))
        no_of_tasks = len(admin.get('applications', []))
        
        if admin.get('applications'):
            latest_deadline = max(app['deadline'] for app in admin['applications'])
        else:
            # If no tasks, set deadline to 2 days from today
            latest_deadline = datetime.now().date() + timedelta(days=2)
        
        member.append([admin_id, no_of_tasks, latest_deadline])
    return member


def get_members_expert():
    """
    Retrieve members from the Expert Visit committee
    
    Returns:
        List of members with their task details
    """
    member = []
    admins = list(admins_collection.find({"committee": "Expert Visit"}))
    for admin in admins:
        admin_id = str(admin.get('_id'))
        no_of_tasks = len(admin.get('applications', []))
        
        if admin.get('applications'):
            latest_deadline = max(app['deadline'] for app in admin['applications'])
        else:
            # If no tasks, set deadline to 2 days from today
            latest_deadline = datetime.now().date() + timedelta(days=2)
        
        member.append([admin_id, no_of_tasks, latest_deadline])
    return member


def allocate_task(members):
    """
    Allocate a task to the member with the least burden
    
    Args:
        members (list): List of members with their task details
    
    Returns:
        list: Updated list of members after task allocation
    """
    # Sort by number of tasks (ascending), then by earliest deadline
    members.sort(key=lambda x: (x[1], x[2]))
    
    # Select the member with the least burden
    selected_member = members[0]
    
    # Increment task count
    selected_member[1] += 1
    
    # If no previous tasks, set deadline to 2 days from today
    # Otherwise, extend existing deadline by 2 days
    if selected_member[2] == datetime.min.date():
        selected_member[2] = datetime.now().date() + timedelta(days=2)
    else:
        selected_member[2] += timedelta(days=2)
    
    return members