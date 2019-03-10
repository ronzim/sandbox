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
# fill a song - artist list DONE (do it better)
# check each message on arrival DONE
# check list for double songs: read csv, check string (title) similarity
# google drive upload

from __future__ import unicode_literals
import youtube_dl
import requests
import time
import csv
from telethon import TelegramClient, sync
from telethon import utils
from telethon import events
from googlesearch import search
import pickle
import sys
import os

# management vars
ALL_CHAT = True

def getSongLinks(client):
    '''
    get links from a chat
    '''
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


def getYoutubeLink(link):
    '''
    get youtube link from any link that contains a song query
    '''
    if (link.count('youtube') > 0):
        return link
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
            for link in search(query, tld = 'co.in', num=1, stop=10, pause=2):
                if 'youtube' in link:
                    print ('>>> YOUTUBE link: ',link)
                    return link
            return False
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
    print(link)
    if (link == None):
        return False
    youtube_link = getYoutubeLink(link);
    if (youtube_link == None):
        return False
    print (youtube_link)
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
    # 'outtmpl' : './Songs/%(title)s.%(ext)s',
    'outtmpl' : './Songs/%(artist)s - %(title)s.%(ext)s',
    # 'outtmpl' : '/media/mattia/DATA/2songs1day_7.2.19/%(artist)s - %(title)s.%(ext)s',
    'format': 'bestaudio/best',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'logger': MyLogger(),
    'progress_hooks': [my_hook],
    'noplaylist':True
}

# ------------------------------------------------------

if __name__ == '__main__':

    # telegram app ids
    api_id = 645418
    api_hash = 'eea5641186e0070290129f98aa416d76'

    client = TelegramClient('session_name', api_id, api_hash).start()
    # client.disconnect()

    # ================================================
    # RUN DOWNLOADER ON SINGLE INCOMING MESSAGE  =====
    # ================================================

    if not ALL_CHAT:
        @client.on(events.NewMessage)
        async def handler(event):
            print (" ------- RECEIVED NEW MESSAGE ------- ")
            print ('chat id: ', event.input_chat.chat_id)
            print ('raw msg: ', event.raw_text)
            if (event.input_chat.chat_id == 328985728 and 'http' in event.raw_text):
                # if message contains a link
                youtube_link = processMsg(event.raw_text)
                print ('>>> youtube_link', youtube_link)
                if (youtube_link != False):
                    outfile = open('song_links.txt', 'a+')
                    outfile.write(youtube_link + '\n')
                    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
                        try:
                            print ('DOWNLOADING', youtube_link)
                            ydl.download([youtube_link])
                            outfile.write('DOWNLOAD OK\n')
                            print('DOWNLOADED!')
                            await event.reply('download success')
                        except:
                            outfile.write('ERROR DOWNLOADING\n')
                            print ('error downloading')
                    outfile.write('####################')
                    outfile.close()

        client.run_until_disconnected()

    # ================================================
    # RUN DOWNLOADER ON ALL CHAT MESSAGES  ===========
    # ================================================

    if ALL_CHAT:

        for dialog in client.get_dialogs(limit=10):
            print('>>> getting dialog', dialog.name)

        path_list_urls = 'urls.pkl'

        if os.path.isfile(path_list_urls):
            scarica = input("Vuoi aggiornare la lista? [Y/N]")

            if scarica.lower() not in ['y','n']:
                sys.exit()
            elif scarica.lower() == 'y':
                urls = getSongLinks(client)
                with open(path_list_urls, 'wb') as f:
                    pickle.dump(urls, f)
            else:
                with open(path_list_urls, 'rb') as f:
                    urls = pickle.load(f)
        else:
            urls = getSongLinks(client)
            with open(path_list_urls, 'wb') as f:
                pickle.dump(urls, f)


        riscarica = input("Vuoi scaricare le canzoni già presenti nella cartella? [Y/N]")
        if riscarica.lower() not in ['y','n']:
            sys.exit()
        elif riscarica.lower() == 'y':
            RISCARICA = True
        else:
            RISCARICA = False

        outfile = open('song_links.txt', 'a')
        # outfile.write('########################## INIT NEW SESSION ################')
        # with open('./songs.csv', 'wb', newline='') as myfile:
        with open('./songs.csv', 'w') as myfile:
            wr = csv.writer(myfile, quoting=csv.QUOTE_ALL)
            wr.writerow(urls)

        ok = 0
        nok = 0

        for counter, entry in enumerate(urls):
            print ('##', counter, ' out of ', len(urls))
            if entry:
                print ('GETTING LINK FROM', entry)
                youtube_link = getYoutubeLink(entry)
                if youtube_link:
                    outfile.write(youtube_link + '\n')
                    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
                        try:
                            result = ydl.extract_info("{}".format(youtube_link), download=False)
                            title =  '' if result.get("title", '') is None else result.get("title", '')
                            artist = '' if result.get("artist", '') is None else result.get("artist", '')
                            file = ydl.prepare_filename(result)
                            file = os.path.splitext(file)[:-1][0]+'.mp3'

                            if os.path.isfile(file) and not RISCARICA:
                                print ('song already present')
                                continue

                            with open('dowloaded_song.csv', 'a') as f:
                                f.write(';'.join([title,artist,youtube_link,entry]))
                                f.write('\n')

                            print ('DOWNLOADING', youtube_link)
                            ydl.download([youtube_link])
                            ok+=1
                            outfile.write('\n# DOWNLOAD OK #\n')
                        except:
                            print ('error, continue')
                            nok+=1
                            outfile.write('\n! DOWNLOAD ERROR !\n')
                            continue

        outfile.write('#################### END PROCESSING #####################')
        outfile.close()
        # client.disconnect()
        print (' ### DONE ### ')
        print (ok, 'ok')
        print (nok, 'nok')

        # just a try
        # for msg in client.iter_messages('Mattia Ronzoni'): # no limits!
        #     if (msg.message is not None):
        #         print (utils.get_display_name(msg.sender), msg.message)
