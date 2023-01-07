# reads input from Voting Form Responses
from __future__ import print_function

import os.path
import csv
import re 

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
CREDS = None
SCHOOLS = dict()
STUDENTS = dict()
CATEGORIES = dict()

def authorize(): 
    global CREDS, SCOPES

    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('token.json'):
        CREDS = Credentials.from_authorized_user_file('token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not CREDS or not CREDS.valid:
        if CREDS and CREDS.expired and CREDS.refresh_token:
            CREDS.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            CREDS = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(CREDS.to_json())


def get_cats(): 
    global CATEGORIES

    with open("pt_bkdwn.csv", newline='') as file: 
        reader = csv.reader(file, delimiter=',')
        for line in reader: 
            CATEGORIES[line[0]] = int(line[1])


def make_dict(): 
    global SCHOOLS, STUDENTS

    try:
        service = build('sheets', 'v4', credentials=CREDS)

        result = service.spreadsheets().values().get(
            spreadsheetId="1HoceuRdtyhuFlUaa-Lg2NkzPXBSK77t3tMWNji6DT1o", range="A11:B562").execute()
        rows = result.get('values', [])
        
        for row in rows:
            if not row: continue 

            if len(row) == 1 and  "(" in row[0]: 
                school_name = row[0]
                school_name = "".join(school_name[0: school_name.index("(")])
                SCHOOLS[school_name] = dict()
                for cat in CATEGORIES: 
                    SCHOOLS[school_name][cat] = 0
            elif len(row) == 2: 
                 STUDENTS[row[1]] = school_name
        return 
    except HttpError as error:
        print(f"An error occurred: {error}")
        return error


def debate_calc(spreadsheet_id, num_rows):
    global SCHOOLS, STUDENTS

    try: 
        service = build('sheets', 'v4', credentials=CREDS)

        #moderator: D ; speakers: F
        result = service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id, range="D1:F36").execute()
        rows = result.get('values', [])

        mods = dict()
        best_speaker = dict()
        for row in rows:
            mod_name = row[0] # getting moderator names
            if mod_name not in mods.keys(): mods[mod_name] = 0
            mods[mod_name] += 1

            vote = row[2] # getting best speaker vote 
            if vote not in best_speaker.keys(): best_speaker[vote] = 0
            best_speaker[vote] += 1

        # finding most likely moderator name and giving points to school
        mods = sorted(mods.items(), key=lambda x: x[1], reverse=True)
        for mod_nm in mods.keys(): 
            if mod_nm in STUDENTS.keys(): 
                SCHOOLS[STUDENTS[mod_nm]]["moderating"] += 1
                break 

        # finding best speaker(s)
        best = []
        curr_max = 0
        for name, votes in best_speaker.items(): 
            if votes > curr_max: 
                best = [name]
                curr_max = votes
            elif votes == curr_max: 
                best.append(name)
        # allotting best speaker points
        for name in best: 
            name_lst = name.split(" ")
            for j in range(1, len(name_lst)): 
                combo = " ".join(name_lst[j-1:j+1])
                if combo in STUDENTS.keys(): 
                    SCHOOLS[STUDENTS[combo]]["best speaker"] += 1

        return
    except HttpError as error:
        print(f"An error occurred: {error}")
        return error


def write(spreadsheet_id):
    global SCHOOLS

    get_cats()
    make_dict()
    
    num_debates = int(input("How many debates?"))
    for i in range(num_debates): 
        debate_calc(input("Enter mod spreadsheet ID: "), int(input("Enter # responses: ")))
    

    # assigning final points
    for school in SCHOOLS.keys(): 
        total = 0 
        for key, value in SCHOOLS[school].items(): 
            total += CATEGORIES[key] * value
        SCHOOLS[school]["total"] = total    

    school_list = [[key] + list(value.values()) for key, value in SCHOOLS.items()]
    school_list.sort(key = lambda x: x[0])
    # adding titles for speadsheet
    school_list.insert(0, ["School name", "Main Speaking", "Moderating", "Sub Speaking", "Best Speaker", "Assembly Meeting", "Total"])

    try:
        service = build('sheets', 'v4', credentials=CREDS)
        body = {
            'values': school_list
        }
        result = service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id, range="A1:G" + str(len(school_list)),
            valueInputOption="USER_ENTERED", body=body).execute()
        print(f"{result.get('updatedCells')} cells updated.")
        return result
    except HttpError as error:
        print(f"An error occurred: {error}")
        return error


# get attendance sheet and do name lookup
def findschool(name): 
    try:
        service = build('sheets', 'v4', credentials=CREDS)

        result = service.spreadsheets().values().get(
            spreadsheetId="1HoceuRdtyhuFlUaa-Lg2NkzPXBSK77t3tMWNji6DT1o", range="A10:B560").execute()
        rows = result.get('values', [])
        
        student_dir = dict()
        curr_school = None
        for row in rows:
            if not row: continue 

            if len(row) == 1: 
                curr_school = row[0]
                curr_school = "".join(curr_school[0: curr_school.index("(")])
            else: 
                student_dir[row[1].lower()] = curr_school

        if name.lower() in student_dir.keys(): return student_dir[name.lower()]
        print(student_dir)
        print(name.lower())
        
        print(name.lower() in student_dir.keys())
        return name
    except HttpError as error:
        print(f"An error occurred: {error}")
        return error


if __name__ == '__main__':
    authorize()
    write("1vIpXmQCjQxDzfGiwGJbH-DfilBkn9tE3wEymFy_7Z5M")