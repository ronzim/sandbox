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
CREATE_GRAPH = False

expenses = {}

def add_expense(type, val):
    if type in list(expenses.keys()):
        expenses[cat] += val
        new = False
    else:
        expenses[type] = val
        new = True
    return new

def utc_to_local(utc_dt):
    return utc_dt.replace(tzinfo=timezone.utc).astimezone(tz=None)

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
        csv_writer.writerow(['Date', 'Time', 'Value', 'Type', 'Mod'])

    n = 0

    # iter on all messages
    for raw_msg in client.iter_messages('Spese'): # no limits!
        if raw_msg is not None and raw_msg.message is not None:

            msg = raw_msg.message.split(' ')
            n += 1
            print (n, '-', msg)
            correct_date = utc_to_local(raw_msg.date).strftime('%x')
            correct_time = utc_to_local(raw_msg.date).strftime('%X')

            with open('expenses.csv', mode='a+') as out_file:
                csv_writer = csv.writer(out_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
                csv_writer.writerow([correct_date, correct_time, msg[0], msg[1]])

            value = float(msg[0])
            type = msg[1]
            if len(msg)>2: mod = msg[2]

            add_expense(type, value)

    print ('\n ---- PARTIAL ----')
    tot = 0

    for item in expenses:
        print (item, expenses[item])
        out_msg = item + ' : ' + str(expenses[item])
        if SEND_CHAT : client.send_message("Spese", out_msg)
        tot += expenses[item]

    print ('\n ---- TOTAL ----')
    print (tot, '€')
    out_msg = 'total: ' + str(tot)
    if SEND_CHAT : client.send_message("Spese", out_msg)

    if CREATE_GRAPH :
        fig = pl.Figure(data=pl.Bar(x=list(expenses.keys()), y=list(expenses.values())))
        fig.write_html('graph.html', auto_open=True)
