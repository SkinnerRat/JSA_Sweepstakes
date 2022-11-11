# reads input from Moderator Digital Organization Sheet responses
# order = Best Speaker, Moderator, Main Speakers (x2), Sub Speakers (x2)
# if multiple best / sub speakers, should be separated by newline 

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


def write(spreadsheet_id, values):
    try:
        service = build('sheets', 'v4', credentials=CREDS)
        body = {
            'values': values
        }
        result = service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id, range="A1:G" + str(len(values)),
            valueInputOption="USER_ENTERED", body=body).execute()
        print(f"{result.get('updatedCells')} cells updated.")
        return result
    except HttpError as error:
        print(f"An error occurred: {error}")
        return error


def calc(spreadsheet_id, num_debates): 
    categories = dict()
    with open("pt_bkdwn.csv", newline='') as file: 
        reader = csv.reader(file, delimiter=',')
        for line in reader: 
            categories[line[0]] = int(line[1])

    try:
        service = build('sheets', 'v4', credentials=CREDS)

        # best speaker: column F
        # moderator: column G
        # main pro / con: H / I
        # sub pro / con: J / K
        result = service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id, range="F2:K" + str(num_debates+1)).execute()
        rows = result.get('values', [])

        schools = dict()
        for row in rows: 
            for j in range(0, 6): #best speaker, mod, main (x2), sub (x2)
                if j == 0: cat_name = "best speaker"
                elif j == 1: cat_name = "moderating"
                elif j == 2 or j == 3: cat_name = "main speaking"
                else: cat_name = "subsequent speaking"

                if "n/a" in row[j].lower(): continue

                # looking through each name, school pair at a time
                pairs = row[j].split("\n")
                for pair in pairs: 
                    pair = pair.lower()
                    # separating name and school
                    if "harvard-westlake" in pair.lower(): pair = pair.replace("harvard-westlake", "harvard westlake")
                    iterable = re.split('[;,:/\-(]', pair)
                    
                    if len(iterable) == 1 and len(iterable[0].strip().split(' ')) <= 2: 
                        name = iterable[0]
                        school = findschool(name)
                    elif len(iterable) == 1: 
                        iterable = iterable[0].split(' ')
                        name = " ".join(iterable[0:2])
                        school = " ".join(iterable[2:])
                    else: 
                        name = " ".join(iterable[:-1])
                        school = iterable[-1]
                    
                    name = name.strip()
                    school = school.replace(")", "")
                    school = school.strip().replace(" high school", "").replace(" hs", "")

                    # counting occurences of each activity
                    if school not in schools.keys(): 
                        schools[school] = dict()
                        for category_name in categories.keys(): schools[school][category_name] = 0
                    schools[school][cat_name] += 1  
        
        # assigning final points
        for school in schools.keys(): 
            total = 0 
            for key, value in schools[school].items(): 
                total += categories[key] * value
            schools[school]["total"] = total
            
        # making list out of dictionary
        school_list = [[key] + list(value.values()) for key, value in schools.items()]
        school_list.sort(key = lambda x: x[0])
        # adding titles for speadsheet
        school_list.insert(0, ["School name", "Main Speaking", "Moderating", "Sub Speaking", "Best Speaker", "Assembly Meeting", "Total"])
        
        return school_list
    except HttpError as error:
        print(f"An error occurred: {error}")
        return error

# get attendance sheet and do simple lookup
def findschool(name): 
    return "Unknown"

if __name__ == '__main__':
    authorize()
    write("1vIpXmQCjQxDzfGiwGJbH-DfilBkn9tE3wEymFy_7Z5M", calc("17wyl-xPkrLglGWjaVBOJVfn5Mf5_iDOc31K72zjIPbY", 30))