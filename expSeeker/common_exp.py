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

## TODO
#   - a serious db
#   - a remove-last / reset keyword
#   - maybe a graph

SEND_CHAT = False
CREATE_GRAPH = True
CHAT_NAME = "Chi_paga?"
CHAT_ID = 341554723

def parse_msg(input_str):
    chi, quanto = input_str.split(' ')
    print (type(chi) is str, type(quanto) is str)
    # sanity check
    if (chi is not None, quanto is not None):
        return chi, quanto
    else:
        return False, False

def add_expense(who, val):
    lisa_tot = 0
    mattia_tot = 0
    # TODO add timestamp
    with open('common_expenses.csv', mode='a+') as out_file:
        csv_writer = csv.writer(out_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        csv_writer.writerow([who,val])
    out_file.close()
    print ('C ', lisa_tot, mattia_tot)

    with open('common_expenses.csv', mode='r') as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        for row in csv_reader:
            print ('R', row)
            name = row[0]
            value = int(row[1])
            if name.count('Lisa') or name.count('lisa'):
                lisa_tot += value
            elif name.count('Mattia') or name.count('mattia'):
                mattia_tot += value
            else :
                print('nan')

    if mattia_tot > lisa_tot :
        next_payer = 'Lisa'
        distance = mattia_tot - lisa_tot
    else :
        next_payer = 'Mattia'
        distance = lisa_tot - mattia_tot

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
        if (event.input_chat.chat_id == CHAT_ID):
            entry_who, entry_val = parse_msg(event.raw_text)
            if (entry_who and entry_val):
                next_payer, balance = add_expense(entry_who, entry_val)
                message = 'Next to pay: ' + str(next_payer) + " " + str(balance)
                print (message)
                await client.send_message(CHAT_NAME, message)
                # client.send_message(chat_name, message)


    client.run_until_disconnected()
