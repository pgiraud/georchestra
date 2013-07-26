from pyramid.config import Configurator


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    config = Configurator(settings=settings)
    config.add_static_view('static', 'static', cache_max_age=3600)
    config.add_route('groups', '/groups')
    config.add_route('group', '/groups/:group')
    config.add_route('groups_users', '/groups_users')
    config.add_route('users', '/users')
    config.add_route('user', '/users/:user')
    config.scan()
    return config.make_wsgi_app()