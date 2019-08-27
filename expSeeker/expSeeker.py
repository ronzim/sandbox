# hash : eea5641186e0070290129f98aa416d76
# id : 645418

# useful links:
# https://telethon.readthedocs.io/en/latest/extra/basic/telegram-client.html #telegram-client

# useful python methods:
# a_string.split()
#.index()
#.count()
#.startswith()
# obj = open('data.txt', 'a+') #append or create
# obj.write(data + '\n')
# obj.close()

from __future__ import unicode_literals
import requests
import time
import csv
from telethon import TelegramClient, sync
from telethon import utils
from telethon import events
import pickle
import sys
import os
import csv

SEND_CHAT = False

expenses = {
    'traghetto'  : 0,
    'campeggio'  : 0,
    'benzina'    : 0,
    'spesa'      : 0,
    'corone'     : 0,
    'parcheggio' : 0,
    'cassa'      : 0,
    'altro'      : 0,
    'riparaz'    : 0
}

def add_expense(cat, val, cur):
    if currency.count('NOK') or currency.count('nok'):
        val /= 10
    expenses[cat] += val
    print (' *** added', val, 'to', cat)

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

    # write into csv
    with open('expenses.csv', mode='w+') as out_file:
        csv_writer = csv.writer(out_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        # header
        csv_writer.writerow(['Type', 'Value', 'Currency', 'Who'])

    n = 0

    # iter on all messages
    for raw_msg in client.iter_messages('Norway'): # no limits!
        if raw_msg is not None and raw_msg.message is not None:
            msg = raw_msg.message.split(',');

            if msg[0] == '#spese' :
                n += 1
                print (n, '-', msg[1], msg[2], msg[3])

                with open('expenses.csv', mode='a+') as out_file:
                    csv_writer = csv.writer(out_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
                    csv_writer.writerow([msg[1], msg[2], msg[3], msg[4]])

                type = msg[1]
                value = float(msg[2])
                currency = msg[3]

                if type.count('traghetto') :
                    add_expense('traghetto', value, currency)

                elif type.count('campeggio') :
                    add_expense('campeggio', value, currency)

                elif type.count('spesa') :
                    add_expense('spesa', value, currency)

                elif type.count('benzina') :
                    add_expense('benzina', value, currency)

                elif type.count('corone') :
                    add_expense('corone', value, currency)

                elif type.count('parcheggio') :
                    add_expense('parcheggio', value, currency)

                elif type.count('cassa') :
                    add_expense('cassa', value, currency)

                elif type.count('riparaz') :
                    add_expense('riparaz', value, currency)

                else :
                    add_expense('altro', value, currency)

    print ('\n ---- PARTIAL ----')
    tot = 0

    for item in expenses:
        print (item, expenses[item])
        out_msg = item + ' : ' + str(expenses[item])
        if SEND_CHAT : client.send_message("Norway", out_msg)

        if item is not 'riparaz':
            tot += expenses[item]

    print ('\n ---- TOTAL ----')
    print (tot, '€')
    out_msg = 'total: ' + str(tot)
    if SEND_CHAT : client.send_message("Norway", out_msg)
