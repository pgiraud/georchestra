from pyramid.view import view_config
from pyramid.response import Response

import json
import uuid

json_data = open('data/groups.json')
_groups = json.load(json_data, parse_int=int, parse_float=float)
json_data.close()

json_data = open('data/all.json')
_users = json.load(json_data, parse_int=int, parse_float=float)
json_data.close()
#print f.read()
#_users = {
    #'foo': {
        #'name': 'toto'
    #},
    #'bar': {
        #'name': 'titi'
    #}
#}

class RESTView(object):
    def __init__(self, request):
        self.request = request

    @view_config(route_name='groups', renderer='json', request_method='GET')
    def get_groups(self):
        return _groups

    @view_config(route_name='users', renderer='json', request_method='GET')
    def get(self):
        return _users

    @view_config(route_name='user', renderer='json', request_method='GET')
    def user(self):
        user = self.request.matchdict['user']
        for ndx, i in enumerate(_users):
            if str(i['id']) == user:
                return _users[ndx]
        return 'user not found'

    @view_config(route_name='users', renderer='json', request_method='POST')
    def post(self):
        id = str(uuid.uuid4())
        user = {
            'name': self.request.json_body['name'],
            'email': self.request.json_body['email'],
            'id': id
        }
        _users.append(user)
        return user

    @view_config(route_name='user', request_method='PUT')
    def put(self):
        user = self.request.matchdict['user']
        for ndx, i in enumerate(_users):
            if str(i['id']) == user:
                i['name'] = self.request.json_body['name']
                i['email'] = self.request.json_body['email']
        return Response('put')

    @view_config(route_name='user', request_method='DELETE')
    def delete(self):
        user = self.request.matchdict['user']
        for ndx, i in enumerate(_users):
            if str(i['id']) == user:
                del _users[ndx]
        return Response('delete')

    ''' Add or remove users to/from groups '''
    @view_config(route_name='groups_users', request_method='POST')
    def put_groups(self):
        users = self.request.json_body['users']
        to_put = self.request.json_body['PUT']
        to_delete = self.request.json_body['DELETE']

        print users

        for nj, j in enumerate(users):
            user = getUserById(j)
            for group in to_put:
                user['groups'].append(group)
            for group in to_delete:
                user['groups'].remove(group)
        return Response('put')

def getUserById(id):
    for ndx, i in enumerate(_users):
        if str(i['id']) == id:
            return i