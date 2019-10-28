# ======================================= #
# === experimenting with pyDrive APIs === #
# ======================================= #

import os
import time
from difflib import SequenceMatcher
from pydrive.auth import GoogleAuth
from pydrive.drive import GoogleDrive

# == Constants == #
songs_folder = '/home/mattia/Videos'
fid = '14GpG2nps7xTgSx7fvpcyyoSXKyiZ3pEf'

# == Check if a local entry is already present on google drive list == #

def checkPresence(name, drive_list):
    for drive_name in drive_list:
        # print(drive_name['title'], name)
        #convert to ascii
        raw_str = drive_name['title'].encode('ascii', 'replace')
        # print raw_str
        # sequence matcher to check for sligtly different strings
        res = SequenceMatcher(None, name, raw_str)
        # print(res.ratio())
        # time.sleep(1)
        if (res.ratio() > 0.5):
            # if (raw_str == name):
            # print ('>>>>>>>>>>> match!')
            return True
        return False

# == Upload a music file to drive folder == #

def uploadSong(song_filename, drive):

    # upload a text file
    # file1 = drive.CreateFile({'title':'prova.txt'})
    # file1.SetContentString('boboboboboboboooooobs')
    # file1.Upload()
    # print(file1['title'], file1['id'])
    #
    #upload a song
    # file5 = drive.CreateFile({'title':song_filename})
    file5 = drive.CreateFile({"title":song_filename, "parents": [{"kind": "drive#fileLink", "id": fid}]})
    # Read file and set it as a content of this instance.
    file5.SetContentFile('/home/mattia/Videos/' + song_filename)
    file5.Upload() # Upload the file.
    print('title: %s, mimeType: %s' % (file5['title'], file5['mimeType']))

# == Perform autentication and get drive file list == #

gauth = GoogleAuth()
gauth.LocalWebserverAuth()
drive = GoogleDrive(gauth)

# file_list = drive.ListFile({'q': "mimeType = 'application/vnd.google-apps.folder' and title contains '2songs1day'"}).GetList()
# folder_list = drive.ListFile({'q': "title contains '2songs1day'"}).GetList()
# use id-searching to obtain all children
drive_list = drive.ListFile({'q': "'14GpG2nps7xTgSx7fvpcyyoSXKyiZ3pEf' in parents"}).GetList()
# for file1 in drive_list:
#   print('title: %s, id: %s' % (file1['title'], file1['id']))

# == List files in local songs directory == #

songs_list = os.listdir(songs_folder)

# == For each file, if it is not present on drive, perform upload == #

for song_filename in songs_list:
    # print song_filename
    # how to check for string similarity: https://stackoverflow.com/questions/17388213/find-the-similarity-metric-between-two-strings
    res = checkPresence(song_filename, drive_list)
    if (res):
        # print (song_filename, 'already there')
        print ('.')
    else:
        print ('>> New!', song_filename)
        uploadSong(song_filename, drive)
