import csv

categories = []
with open("pt_bkdwn.csv", newline='') as file: 
    reader = csv.reader(file, delimiter=',')
    for line in reader: 
        categories.append(line)

num_schools = int(input("Number of schools to be reported: "))
schools = dict()
for i in range(num_schools): 
    school = input("Enter name of school: ")

    total = 0
    bkdwn = dict()

    for cat in categories: 
        bkdwn[cat[0]] = int(input(f"# times {school} did {cat[0]}: "))
        total +=  bkdwn[cat[0]] * int(cat[1])

    bkdwn["total"] = total
    schools[school] = bkdwn

while True: 
    kill = input("Would you like to change a value? y/n")
    if kill == "n": break
    
    school, cat = input("Enter name of school and category, separated by comma (ex: Westlake, moderating): ").split(", ")
    print(f"{school}'s current value for {cat}: {schools[school][cat]}")
    schools[school][cat] = int(input("Enter new value: "))
    
school_list = [[key, val["total"]] for key, val in schools.items()]
school_list.sort(key=lambda x: x[1], reverse=True)

for i in range(2, -1, -1): 
    print(f"{school_list[i][0]} ranked {i+1} with {school_list[i][1]} points")
