import requests

"""
data = {
    'api_token': '7c1042cd5831c7c617a466cdf3f6c1a4',
    'url': 'https://audd.tech/example.mp3',
    'return': 'spotify',
}
result = requests.post('https://api.audd.io/', data=data)
print(result.text[30:100])
"""


data = {
    'api_token': '7c1042cd5831c7c617a466cdf3f6c1a4',
    'return': 'apple_music,spotify',
}
files = {
    'file': open('c:/Users/Tepex/Desktop/roundabout.mp3', 'rb')
}
result = requests.post('https://api.audd.io/', data=data, files=files).json()
#print(result.text[30:100])
print(result["result"]["artist"] + ' - ' + result["result"]["title"])




