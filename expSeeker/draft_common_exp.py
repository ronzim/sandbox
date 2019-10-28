from __future__ import unicode_literals
import csv
from telethon import TelegramClient, sync
from telethon import utils
from telethon import events
import sys
import os
import csv
import plotly.graph_objects as pl
from datetime import datetime, timezone

SEND_CHAT = False
CREATE_GRAPH = True

def parse_msg(input_str):
    chi, quanto = input_str.split(' ')
    print (chi, quanto)
    # sanity check
    return chi, quanto

def add_expense(who, val):
    lisa_tot = 0
    mattia_tot = 0
    # TODO add timestamp
    with open('common_expenses.csv', mode='a+') as out_file:
        csv_writer = csv.writer(out_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        csv_writer.writerow([who, val])
    print ('C ', lisa_tot, mattia_tot)

    with open('common_expenses.csv') as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        for row in csv_reader:
            name = row[0]
            value = row[1]
            if name == 'Lisa' : lisa_tot += value
            if name == 'Mattia' : mattia_tot += value

    print ('A ', lisa_tot, mattia_tot)

    if mattia_tot > lisa_tot :
        next_payer = 'Lisa'
        distance = mattia_tot - lisa_tot
    else :
        next_payer = 'Mattia'
        distance = lisa_tot - mattia_tot

    print ('B ', next_payer, distance)

    return next_payer, distance

if __name__ == '__main__':

    # telegram app ids
    api_id = 645418
    api_hash = 'eea5641186e0070290129f98aa416d76'

    client = TelegramClient('session_name', api_id, api_hash).start()

    # client.disconnect()

    for dialog in client.get_dialogs(limit=10):
        print('>>> getting dialog', dialog.name)
    # client.disconnect()
    print (' ### DONE ### ')

    @client.on(events.NewMessage)
    async def handler(event):
        print (" ------- RECEIVED NEW MESSAGE ------- ")
        print ('chat id: ', event.input_chat.chat_id)
        print ('raw msg: ', event.raw_text)
        if (event.input_chat.chat_id == 334860988):
            print ('>>>>>>> hey!')
            entry_who, entry_val = parse_msg(event.raw_text)
            next_payer, balance = add_expense(entry_who, entry_val)
            print (next_payer, balance)


    client.run_until_disconnected()
