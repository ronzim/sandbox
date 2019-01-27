# hash : eea5641186e0070290129f98aa416d76
# id : 645418

# useful links:
# https://telethon.readthedocs.io/en/latest/extra/basic/telegram-client.html #telegram-client
# https://stackoverflow.com/questions/4201062/how-can-i-unshorten-a-url
# https://www.geeksforgeeks.org/performing-google-search-using-python-code/

# useful python methods:
# a_string.split()
#.index()
#.count()
#.startswith()
# obj = open('data.txt', 'a+') #append or create
# obj.write(data + '\n')
# obj.close()

# ROADMAP:
# fill a song - artist list
# check each message on arrival
# check list for double songs

from __future__ import unicode_literals
import youtube_dl
import requests
import time
from telethon import TelegramClient, sync
from telethon import utils
from telethon import events
from googlesearch import search

# management vars
all_chat = False

#get links from a chat
def getSongLinks(client):
    raw_urls = []
    # for msg in client.iter_messages('2song1day', limit=1000):
    for msg in client.iter_messages('2song1day'): # no limits!
        # print (utils.get_display_name(msg.sender), msg.message)
        if (msg.message is not None and (msg.message.count('http') > 0) ):
            print ('>>>>>>>> FOUND LINK')
            # print (utils.get_display_name(msg.sender), msg.message.split('\n')[0])
            # print (msg.message)
            print (utils.get_display_name(msg.sender), extractLink(msg.message))
            print ('-------------------')
            raw_urls.append(extractLink(msg.message)) # keep only the link
    print (' ### FOUND ', len(raw_urls), ' ENTRIES ### ')
    return raw_urls

# get youtube link from any link that contains a song query
def getYoutubeLink(link):
    if (link.count('youtube') > 0):
        youtube_link = link
        return youtube_link
    elif (link.count('youtu.be') > 0):
        # get unshortened link
        session = requests.Session()
        resp = session.head(link, allow_redirects = True)
        unshortened_link = resp.url
        return unshortened_link
    else:
        # get unshortened link
        session = requests.Session()
        try:
            resp = session.head(link, allow_redirects = True)
        except:
            print ('error')
            return False
        unshortened_link = resp.url
        if (unshortened_link.count('google') > 0):
            # get query
            # print ('>>> input link: ')
            # print (unshortened_link)
            splitted = unshortened_link.split('q=');
            if (len(splitted)<2):
                return False
            query = splitted[1].split('&')[0]
            # get first google response (hoping it is a youtube link)
            for link in search(query, tld = 'co.in', num=1, stop=1, pause=2):
                # print ('>>> YOUTUBE link: ')
                youtube_link = link
            return youtube_link
        else:
            print ('no matching youtube link')
            return False

def extractLink(string):
    chunks = string.split() #without args split on whitespace
    # link = chunks.split('http')
    def link_seeker(l):
        return l.startswith('https')
    link = filter(link_seeker, chunks)
    # print (link) # iterable
    return next(link, None)

def processMsg(strMsg):
    link = extractLink(strMsg);
    if (link == None):
        return False
    youtube_link = getYoutubeLink(link);
    if (youtube_link == None):
        return False
    return youtube_link

# download feature --------------------------

class MyLogger(object):
    def debug(self, msg):
        pass
    def warning(self, msg):
        pass
    def error(self, msg):
        print(msg)

def my_hook(d):
    if d['status'] == 'finished':
        print('Done downloading, now converting ...')

ydl_opts = {
    'format': 'bestaudio/best',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'logger': MyLogger(),
    'progress_hooks': [my_hook],
}

# ------------------------------------------------------

# telegram app ids
api_id = 645418
api_hash = 'eea5641186e0070290129f98aa416d76'

client = TelegramClient('session_name', api_id, api_hash).start()
# client.disconnect()

# ================================================
# RUN DOWNLOADER ON SINGLE INCOMING MESSAGE  =====
# ================================================

@client.on(events.NewMessage)
async def handler(event):
    print (" ------- RECEIVED NEW MESSAGE ------- ")
    print (event.input_chat.chat_id)
    print (event.raw_text)
    if (event.input_chat.chat_id == 328985728 and 'http' in event.raw_text):
        # if message contains a link
        youtube_link = processMsg(event.raw_text)
        print (youtube_link != False)
        if (youtube_link != False):
            print ("1")
            outfile = open('song_links.txt', 'a+')
            outfile.write(youtube_link + '\n')
            outfile.write('####################')
            outfile.close()
            print ("2")
            with youtube_dl.YoutubeDL(ydl_opts) as ydl:
                print ("3")
                try:
                    print ('DOWNLOADING', youtube_link)
                    ydl.download([youtube_link])
                    print('downloaded')
                    # await event.reply('download success')
                except:
                    print ('error downloading')

client.run_until_disconnected()

# ================================================
# RUN DOWNLOADER ON ALL CHAT MESSAGES  ===========
# ================================================

if (all_chat):

    for dialog in client.get_dialogs(limit=10):
        print('>>> getting dialog', dialog.name)

    urls = []
    # urls = getSongLinks(client)
    outfile = open('song_links.txt', 'a+')

    counter = 0

    for entry in urls:
        counter+=1
        print ('##', counter, ' out of ', len(urls))
        if (entry):
            print ('GETTING LINK FROM', entry)
            youtube_link = getYoutubeLink(entry)
            if (youtube_link):
                outfile.write(youtube_link + '\n')
                with youtube_dl.YoutubeDL(ydl_opts) as ydl:
                    try:
                        print ('DOWNLOADING', youtube_link)
                        ydl.download([youtube_link])
                    except:
                        print ('error, continue')
                        continue

    outfile.write('####################')
    outfile.close()
    # client.disconnect()
    print (' ### DONE ### ')

    # just a try
    # for msg in client.iter_messages('Mattia Ronzoni'): # no limits!
    #     if (msg.message is not None):
    #         print (utils.get_display_name(msg.sender), msg.message)
