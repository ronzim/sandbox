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
        if (event.input_chat.chat_id == 334860988 and 'prova' in event.raw_text):
            print ('>>>>>>> hey!')
            entry = parse_msg(event.raw_text)
            next_payer, balance = add_expense(entry)


    client.run_until_disconnected()
