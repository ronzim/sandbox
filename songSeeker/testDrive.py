# ======================================= #
# === experimenting with pyDrive APIs === #
# ======================================= #

# get folder content list
# match file names
# upload diff

import os
from difflib import SequenceMatcher
from pydrive.auth import GoogleAuth
from pydrive.drive import GoogleDrive

gauth = GoogleAuth()
gauth.LocalWebserverAuth()

drive = GoogleDrive(gauth)

# Auto-iterate through all files in the root folder.
# file_list = drive.ListFile({'q': "mimeType = 'application/vnd.google-apps.folder' and title contains '2songs1day'"}).GetList()
# folder_list = drive.ListFile({'q': "title contains '2songs1day'"}).GetList()
# use id-searching to obtain all children
drive_list = drive.ListFile({'q': "'14GpG2nps7xTgSx7fvpcyyoSXKyiZ3pEf' in parents"}).GetList()
# for file1 in drive_list:
#   print('title: %s, id: %s' % (file1['title'], file1['id']))

# list files in songs dir
songs_folder = '/home/mattia/Videos'
songs_list = os.listdir(songs_folder)

import time

def checkPresence(name, drive_list):
    for drive_name in drive_list:
        # print(drive_name['title'], name)
        #convert to ascii
        raw_str = drive_name['title'].encode('ascii', 'replace')
        # print raw_str
        # sequence matcher to check for sligtly different strings
        # res = SequenceMatcher(name, raw_str)
        # print(res.ratio())
        # if (res.ratio() > 0.5):
        if (raw_str == name):
            # print ('>>>>>>>>>>> match!')
            return True
    return False

for song_filename in songs_list:
    # print song_filename
    # TODO check if already present in google drive list
    # how to check for string similarity: https://stackoverflow.com/questions/17388213/find-the-similarity-metric-between-two-strings
    res = checkPresence(song_filename, drive_list)
    if (res):
        print (song_filename, 'already there')
    else:
        print (song_filename, 'is new')

# upload a text file
# file1 = drive.CreateFile({'title':'prova.txt'})
# file1.SetContentString('boboboboboboboooooobs')
# file1.Upload()
# print(file1['title'], file1['id'])
#
#upload a song
# file5 = drive.CreateFile({'title':'songName.mp3'})
# # Read file and set it as a content of this instance.
# file5.SetContentFile('/home/mattia/Videos/883 - Come deve andare.mp3')
# file5.Upload() # Upload the file.
# print('title: %s, mimeType: %s' % (file5['title'], file5['mimeType']))
